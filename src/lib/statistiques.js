// Statistiques de visites avec Matomo, installé chez nous (https://stats.bontin.fr, hébergement IONOS).
// Réglé pour l'exemption de consentement de la CNIL : aucun cookie (disableCookies), adresses IP
// anonymisées dans Matomo, aucune donnée partagée avec un tiers. Pas de bandeau nécessaire, mais le
// visiteur peut refuser d'être compté (politique de confidentialité → ChoixStatistiques).
// Actif seulement sur bontin.fr (pas sur les préversions ni sur l'ordinateur), jamais sur /admin.
const MATOMO = 'https://stats.bontin.fr/'
const SITE_ID = '1'
const CLE_REFUS = 'bontin-stats-refus'
const ACTIF = typeof window !== 'undefined' && /^(www\.)?bontin\.fr$/i.test(window.location.hostname)

let charge = false
let derniere = ''
let minuteur = null

export function statistiquesRefusees() {
  try {
    return localStorage.getItem(CLE_REFUS) === '1'
  } catch {
    return false
  }
}

export function refuserStatistiques(refus) {
  try {
    if (refus) localStorage.setItem(CLE_REFUS, '1')
    else localStorage.removeItem(CLE_REFUS)
  } catch {
    // stockage indisponible (navigation privée stricte) : rien à faire
  }
}

function charger() {
  const paq = (window._paq = window._paq || [])
  paq.push(['disableCookies'])
  paq.push(['setTrackerUrl', `${MATOMO}matomo.php`])
  paq.push(['setSiteId', SITE_ID])
  paq.push(['enableLinkTracking'])
  const s = document.createElement('script')
  s.async = true
  s.src = `${MATOMO}matomo.js`
  document.head.appendChild(s)
  charge = true
}

// Appelée à chaque changement de page (depuis useSeo). Petite attente pour compter la page une seule
// fois, avec son vrai titre (une fiche produit reçoit son nom un instant après l'ouverture).
export function pageVue() {
  if (!ACTIF || statistiquesRefusees()) return
  const chemin = window.location.pathname
  if (chemin === '/admin' || chemin.startsWith('/admin/')) return
  clearTimeout(minuteur)
  minuteur = setTimeout(() => {
    const url = window.location.pathname + window.location.search
    if (url === derniere) return
    if (!charge) charger()
    const paq = window._paq
    if (derniere) paq.push(['setReferrerUrl', `${window.location.origin}${derniere}`])
    paq.push(['setCustomUrl', url])
    paq.push(['setDocumentTitle', document.title])
    const recherche = chemin.match(/^\/recherche\/(.+)$/)
    if (recherche) {
      let mot = recherche[1]
      try {
        mot = decodeURIComponent(mot)
      } catch {
        // adresse mal formée : on garde le texte tel quel
      }
      paq.push(['trackSiteSearch', mot.replace(/-/g, ' '), false, false])
    } else {
      paq.push(['trackPageView'])
    }
    derniere = url
  }, 800)
}

// --- Paniers abandonnés (26/11/2026) ------------------------------------------------------------------------
// Fonction « E-commerce » de Matomo (à cocher une fois dans Matomo : Administration → Sites web → Gérer →
// « Site e-commerce »). Chaque changement de panier envoie son contenu (produits, quantités) ; une commande
// enregistrée vide le panier côté Matomo. Un panier jamais commandé apparaît dans « E-commerce → Paniers
// abandonnés ». Anonyme : Matomo ne sait pas QUI a fait le panier, seulement ce qu'il contenait.
// Valeur indicative : prix livraison de base (sans promo ni remise retrait).
function pret() {
  if (!ACTIF || statistiquesRefusees()) return null
  if (!charge) charger()
  return window._paq
}

let minuteurPanier = null
export function panierModifie(items) {
  const paq = pret()
  if (!paq || !items.length) return
  clearTimeout(minuteurPanier)
  minuteurPanier = setTimeout(() => {
    paq.push(['clearEcommerceCart'])
    let total = 0
    for (const i of items) {
      const prix = Number(i.prix_livraison) || 0
      total += prix * i.quantity
      paq.push(['addEcommerceItem', i.cartKey, i.nom, [], prix, i.quantity])
    }
    paq.push(['trackEcommerceCartUpdate', Math.round(total * 100) / 100])
  }, 1500)
}

export function commandeEnregistree(commande, items) {
  const paq = pret()
  if (!paq || !commande?.id) return
  clearTimeout(minuteurPanier)
  paq.push(['clearEcommerceCart'])
  for (const i of items) paq.push(['addEcommerceItem', i.cartKey, i.nom, [], Number(i.prix_livraison) || 0, i.quantity])
  paq.push(['trackEcommerceOrder', String(commande.id).slice(0, 8).toUpperCase(), Number(commande.total) || 0])
}
