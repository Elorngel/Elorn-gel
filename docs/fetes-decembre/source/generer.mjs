// Fabrique tout le kit des fêtes : visuels JPG, guide HTML, programme texte et dossier sur le Bureau.
// Depuis le dossier du projet :  node docs/fetes-decembre/source/generer.mjs
// Pour refaire seulement quelques visuels :  node docs/fetes-decembre/source/generer.mjs 02-buche-breizh 09-menu-reveillon
// Besoin : Google Chrome installé et une connexion internet (photos des produits lues chez Supabase, polices Google).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PRODUITS, VISUELS } from './publications.mjs'
import { FORMATS, pagesVisuels } from './visuels.mjs'
import { ecrireGuide, ecrireProgramme, copierBureau } from './guide.mjs'

const ici = path.dirname(fileURLToPath(import.meta.url))
const racine = path.resolve(ici, '../../..')
const dossierKit = path.resolve(ici, '..')
const dossierVisuels = path.join(dossierKit, 'visuels')
const travail = fs.mkdtempSync(path.join(os.tmpdir(), 'bontin-fetes-'))
const seulement = process.argv.slice(2)

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean).find((p) => fs.existsSync(p))
if (!CHROME) throw new Error('Google Chrome introuvable (CHROME_PATH=...)')

// 1. Photos des produits (lecture publique Supabase, clé « anon » du site)
const env = Object.fromEntries(
  fs.readFileSync(path.join(racine, '.env.local'), 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const entetes = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.VITE_SUPABASE_ANON_KEY }
const produits = await (await fetch(env.VITE_SUPABASE_URL + '/rest/v1/produits?select=id,nom,photo_url,photo2_url,prix_livraison,en_rupture,actif', { headers: entetes })).json()
const photos = {}
for (const [cle, p] of Object.entries(PRODUITS)) {
  const ligne = produits.find((x) => x.id.startsWith(p.id))
  if (!ligne) throw new Error(`Produit introuvable : ${cle} (${p.nom})`)
  if (ligne.en_rupture || ligne.actif === false) console.warn(`⚠️  ${ligne.nom.trim()} : ${ligne.en_rupture ? 'en rupture' : 'masqué'} sur le site`)
  for (const [suffixe, url] of [['', ligne.photo_url], ['-2', ligne.photo2_url]]) {
    if (!url) continue
    const fichier = path.join(travail, p.id + suffixe + path.extname(new URL(url).pathname))
    fs.writeFileSync(fichier, Buffer.from(await (await fetch(url)).arrayBuffer()))
    photos[p.id + suffixe] = pathToFileURL(fichier).href
  }
}

// 2. Visuels : une page HTML par visuel, photographiée par Chrome, puis convertie en JPG (sips sur Mac)
fs.mkdirSync(dossierVisuels, { recursive: true })
if (!seulement.length) {
  // Visuels d'une ancienne version du calendrier : retirés
  for (const f of fs.readdirSync(dossierVisuels)) if (f.endsWith('.jpg') && !VISUELS[f.slice(0, -4)]) fs.rmSync(path.join(dossierVisuels, f))
}
const logo = pathToFileURL(path.join(racine, 'public/logo.png')).href
const pages = pagesVisuels(photos, PRODUITS, logo)
for (const [cle, html] of Object.entries(pages)) {
  if (seulement.length && !seulement.includes(cle)) continue
  const [w, h] = FORMATS[VISUELS[cle].format]
  const page = path.join(travail, cle + '.html')
  const png = path.join(travail, cle + '.png')
  fs.writeFileSync(page, html)
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--force-color-profile=srgb', '--virtual-time-budget=12000',
    `--window-size=${w},${h}`, `--screenshot=${png}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' })
  const jpg = path.join(dossierVisuels, cle + '.jpg')
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', png, '--out', jpg], { stdio: 'ignore' })
  console.log('✓', cle)
}

// 3. Guide, programme et dossier du Bureau
if (!seulement.length || seulement.includes('guide')) {
  ecrireGuide(dossierKit)
  ecrireProgramme(dossierKit)
  copierBureau(dossierKit)
  console.log('✓ guide, programme et dossier du Bureau')
}
fs.rmSync(travail, { recursive: true, force: true })
