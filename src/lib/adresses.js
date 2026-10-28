// Adresses des pages du site (depuis le 28/10/2026) : de vraies adresses lisibles par Google,
// par ex. /produit/filet-cabillaud-4cef388c ou /rayon/viandes/boeuf, au lieu des anciennes
// adresses en « # » (/#produit/…) que Google ignorait.
// Fichier sans dépendance : il sert aussi au script qui fabrique le plan du site (scripts/generer-seo.mjs).

export function slug(texte) {
  return (
    String(texte || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/œ/g, 'oe')
      .replace(/&/g, ' et ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/, '') || 'page'
  )
}

// Le nom sert à la lisibilité ; seuls les 8 premiers caractères de l'identifiant comptent.
export const urlProduit = (produit) => `/produit/${slug(produit.nom)}-${String(produit.id).slice(0, 8)}`
export const urlRayon = (categorie, sousCategorie) =>
  `/rayon/${slug(categorie)}${sousCategorie ? `/${slug(sousCategorie)}` : ''}`
export const urlRecherche = (texte) => `/recherche/${encodeURIComponent(texte)}`
export const urlParrainage = (code) => `/parrainage/${encodeURIComponent(code)}`

// Pages fixes : adresse → type de page.
const FIXES = {
  '/': 'accueil',
  '/catalogue': 'catalogue',
  '/promotions': 'promotions',
  '/destockage': 'destockage',
  '/petits-formats': 'petits-formats',
  '/panier': 'panier',
  '/mon-compte': 'mon-compte',
  '/cgv': 'cgv',
  '/cgu': 'cgu',
  '/mentions-legales': 'mentions-legales',
  '/confidentialite': 'confidentialite',
  '/admin': 'admin',
  '/admin/roue': 'roue',
}

// Lit une adresse (chemin) et dit de quelle page il s'agit.
export function lirePage(chemin) {
  let c = String(chemin || '/')
  try {
    c = decodeURI(c)
  } catch {
    // adresse mal formée : on la lit telle quelle
  }
  if (c.length > 1) c = c.replace(/\/+$/, '')
  if (c === '/index.html') c = '/'
  if (FIXES[c]) return { type: FIXES[c] }

  let m = c.match(/^\/produit\/(?:.*-)?([0-9a-f]{8})$/i)
  if (m) return { type: 'produit', id8: m[1].toLowerCase() }
  m = c.match(/^\/rayon\/([^/]+)(?:\/([^/]+))?$/)
  if (m) return { type: 'rayon', categorie: m[1], sousCategorie: m[2] || null }
  m = c.match(/^\/recherche\/(.+)$/)
  if (m) return { type: 'recherche', texte: m[1] }
  m = c.match(/^\/parrainage(?:\/([^/]+))?$/)
  if (m) return { type: 'parrainage', code: (m[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '') }
  return { type: 'inconnue' }
}

// Anciens liens en « # » (partagés avant le 28/10/2026, guide PDF, favoris) → nouvelle adresse.
export function depuisAncienLien(hash) {
  let h = String(hash || '').replace(/^#\/?/, '')
  if (!h) return null
  try {
    h = decodeURIComponent(h)
  } catch {
    // on garde tel quel
  }
  let m = h.match(/^produit\/([0-9a-f]{8})/i)
  if (m) return `/produit/p-${m[1].toLowerCase()}`
  m = h.match(/^categorie\/([^/]+)(?:\/(.+))?$/)
  if (m) return urlRayon(m[1], m[2])
  m = h.match(/^recherche\/(.+)$/)
  if (m) return urlRecherche(m[1])
  if (h === 'promo') return '/promotions'
  m = h.match(/^parrainage(?:\/(.+))?$/)
  if (m) return m[1] ? urlParrainage(m[1]) : '/parrainage'
  const fixe = `/${h}`
  return FIXES[fixe] ? fixe : null
}
