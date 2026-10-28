import { useEffect } from 'react'

// Titre de l'onglet, résumé et adresse officielle de chaque page : ce que Google affiche dans ses
// résultats. Les pages privées (panier, compte, recherche, admin) sont marquées « ne pas indexer ».
const SITE = 'https://bontin.fr'
const TITRE_DEFAUT = 'Bontin — Surgelés en livraison ou en retrait'
export const DESCRIPTION_DEFAUT =
  'Bontin : produits surgelés livrés chez vous ou à retirer au dépôt de Plouédern (Finistère). Commandez en ligne, payez à la livraison ou au retrait.'

function balise(selecteur, creer) {
  let el = document.head.querySelector(selecteur)
  if (!el) {
    el = creer()
    document.head.appendChild(el)
  }
  return el
}

const meta = (nom, attribut = 'name') =>
  balise(`meta[${attribut}="${nom}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute(attribut, nom)
    return m
  })

// Texte simple à partir d'une description en HTML (éditeur de l'admin), coupé pour Google.
export function resume(html, longueur = 155) {
  const t = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > longueur ? `${t.slice(0, longueur - 1).replace(/\s+\S*$/, '')}…` : t
}

// « FILET CABILLAUD » → « Filet cabillaud » (titres plus lisibles dans Google).
export function nomLisible(nom) {
  const t = String(nom || '').trim().replace(/\s+/g, ' ')
  if (t !== t.toUpperCase()) return t
  const bas = t.toLowerCase()
  return bas.charAt(0).toUpperCase() + bas.slice(1)
}

export function useSeo({ titre, description, chemin, indexer = true }) {
  useEffect(() => {
    document.title = titre ? `${titre} — Bontin` : TITRE_DEFAUT
    const desc = description || DESCRIPTION_DEFAUT
    meta('description').setAttribute('content', desc)
    meta('og:title', 'property').setAttribute('content', titre || TITRE_DEFAUT)
    meta('og:description', 'property').setAttribute('content', desc)
    const url = `${SITE}${chemin ?? window.location.pathname}`
    meta('og:url', 'property').setAttribute('content', url)
    balise('link[rel="canonical"]', () => {
      const l = document.createElement('link')
      l.setAttribute('rel', 'canonical')
      return l
    }).setAttribute('href', url)
    meta('robots').setAttribute('content', indexer ? 'index, follow' : 'noindex, follow')
  }, [titre, description, chemin, indexer])
}
