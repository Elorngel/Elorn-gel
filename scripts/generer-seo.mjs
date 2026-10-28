// Lancé automatiquement après la construction du site (npm run build → « postbuild »). Fabrique :
// - dist/sitemap.xml : la liste de toutes les pages du site pour Google (produits, rayons, pages fixes) ;
// - dans dist/.htaccess (serveur IONOS), les redirections « 301 » des anciennes adresses PrestaShop vers
//   les nouvelles pages : Google transmet ainsi le référencement de l'ancien site au nouveau.
// Si la base est injoignable, le site se construit quand même (plan du site réduit aux pages fixes).
import fs from 'node:fs'
import { urlProduit, urlRayon } from '../src/lib/adresses.js'
import { pageEquivalente } from '../src/lib/anciennesAdresses.js'

const SITE = 'https://bontin.fr'
const DIST = new URL('../dist/', import.meta.url)
const PAGES_FIXES = ['/', '/catalogue', '/promotions', '/destockage', '/petits-formats', '/parrainage', '/cgv', '/cgu', '/mentions-legales', '/confidentialite']
const REPERE = '# {{REDIRECTIONS_ANCIENNES_ADRESSES}}'

function lireEnv() {
  const env = { url: process.env.VITE_SUPABASE_URL, cle: process.env.VITE_SUPABASE_ANON_KEY }
  if (env.url && env.cle) return env
  try {
    const texte = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const ligne of texte.split('\n')) {
      const [nom, ...reste] = ligne.split('=')
      if (nom.trim() === 'VITE_SUPABASE_URL') env.url = reste.join('=').trim()
      if (nom.trim() === 'VITE_SUPABASE_ANON_KEY') env.cle = reste.join('=').trim()
    }
  } catch {
    // pas de fichier .env.local (construction en ligne) : variables d'environnement seulement
  }
  return env
}

async function lire(env, table, colonnes, filtre = '') {
  const r = await fetch(`${env.url}/rest/v1/${table}?select=${colonnes}${filtre}`, {
    headers: { apikey: env.cle, Authorization: `Bearer ${env.cle}` },
    signal: AbortSignal.timeout(20000),
  })
  if (!r.ok) throw new Error(`${table} : HTTP ${r.status}`)
  return r.json()
}

const echapperXml = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const echapperRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function principal() {
  if (!fs.existsSync(new URL('index.html', DIST))) {
    console.log('generer-seo : dossier dist/ absent, rien à faire.')
    return
  }
  const env = lireEnv()
  let produits = []
  let rayons = []
  try {
    if (!env.url || !env.cle) throw new Error('adresse ou clé Supabase manquante')
    const [p, c, sc] = await Promise.all([
      lire(env, 'produits', 'id,nom,actif', '&actif=eq.true'),
      lire(env, 'categories', 'id,nom'),
      lire(env, 'sous_categories', 'nom,categorie_id'),
    ])
    produits = p
    for (const cat of c) {
      rayons.push(urlRayon(cat.nom))
      for (const sous of sc.filter((s) => s.categorie_id === cat.id)) rayons.push(urlRayon(cat.nom, sous.nom))
    }
  } catch (e) {
    console.warn(`generer-seo : base injoignable (${e.message}) — plan du site réduit aux pages fixes.`)
  }

  // 1. Plan du site
  const jour = new Date().toISOString().slice(0, 10)
  const adresses = [...new Set([...PAGES_FIXES, ...rayons, ...produits.map(urlProduit)])]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${adresses.map((a) => `  <url><loc>${echapperXml(SITE + a)}</loc><lastmod>${jour}</lastmod></url>`).join('\n')}
</urlset>
`
  fs.writeFileSync(new URL('sitemap.xml', DIST), xml)

  // 2. Redirections des anciennes adresses (seulement si on connaît les produits, sinon le site
  //    s'en charge lui-même au chargement de la page).
  const fichier = new URL('.htaccess', DIST)
  let regles = []
  if (produits.length && fs.existsSync(fichier)) {
    const anciennes = fs
      .readFileSync(new URL('anciennes-adresses.txt', import.meta.url), 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('/') && l.length > 1 && !/[?\s]/.test(l))
    regles = anciennes.map(
      (ancienne) => `  RewriteRule ^${echapperRegex(ancienne.slice(1))}$ ${pageEquivalente(ancienne, '', produits)} [R=301,L,NE]`
    )
    const htaccess = fs.readFileSync(fichier, 'utf8')
    if (htaccess.includes(REPERE)) fs.writeFileSync(fichier, htaccess.replace(REPERE, regles.join('\n')))
  }

  console.log(`generer-seo : ${adresses.length} pages dans le plan du site, ${regles.length} anciennes adresses redirigées.`)
}

principal().catch((e) => {
  // Ne jamais faire échouer la construction du site pour ça.
  console.warn(`generer-seo : ${e.message}`)
})
