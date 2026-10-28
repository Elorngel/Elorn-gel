// Navigation dans le site sans recharger la page : on change l'adresse du navigateur (vraies
// adresses /produit/…, /rayon/…) et on prévient l'application. Les liens <a href="/…"> du site
// passent automatiquement par ici (voir interceptionLiens, branché dans App).

const EVENEMENT = 'bontin:page'

export function aller(chemin, { remplacer = false } = {}) {
  const actuel = window.location.pathname + window.location.search
  if (chemin === actuel && !window.location.hash) return
  window.history[remplacer ? 'replaceState' : 'pushState'](null, '', chemin)
  window.dispatchEvent(new Event(EVENEMENT))
  if (!remplacer) window.scrollTo(0, 0)
}

// Appelle f à chaque changement de page (clic, bouton Retour/Suivant du navigateur).
export function ecouterPages(f) {
  window.addEventListener('popstate', f)
  window.addEventListener(EVENEMENT, f)
  return () => {
    window.removeEventListener('popstate', f)
    window.removeEventListener(EVENEMENT, f)
  }
}

// Clic sur un lien interne (href commençant par « / ») : navigation sans rechargement. Les clics
// avec Cmd/Ctrl (nouvel onglet), les liens externes et les téléchargements gardent leur comportement.
export function interceptionLiens(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const lien = e.target.closest?.('a')
  if (!lien || (lien.target && lien.target !== '_self') || lien.hasAttribute('download')) return
  const href = lien.getAttribute('href')
  if (!href || !href.startsWith('/') || href.startsWith('//')) return
  e.preventDefault()
  aller(href)
}
