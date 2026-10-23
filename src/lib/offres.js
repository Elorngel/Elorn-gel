// Libellés des bons d'achat (parrainage, anniversaire…), utilisés dans le panier, « Mon compte » et l'admin.
export const MOTIFS_BON = {
  parrainage_filleul: 'Bon de bienvenue (parrainage)',
  parrainage_parrain: 'Bon parrain',
  anniversaire: 'Bon anniversaire',
  geste: 'Bon d’achat',
}

export const euros = (n) => `${Number(n || 0).toFixed(2)} €`

// Montant dans une phrase : « 25 € », « 12,50 € ».
export const eurosTexte = (n) => {
  const v = Number(n || 0)
  return Number.isInteger(v) ? `${v} €` : `${v.toFixed(2).replace('.', ',')} €`
}

// Lien de parrainage à partager : ouvre la page parrainage avec le code déjà retenu.
export const lienParrainage = (code) => `${window.location.origin}/#parrainage/${encodeURIComponent(code)}`

// Code parrain retenu quand un visiteur arrive par un lien de parrainage (repris à la création du compte).
const CLE_CODE = 'bontin-code-parrain'
export function retenirCodeParrain(code) {
  try {
    localStorage.setItem(CLE_CODE, code)
  } catch {
    // stockage indisponible : le visiteur saisira le code à la main
  }
}
export function codeParrainRetenu() {
  try {
    return localStorage.getItem(CLE_CODE) || ''
  } catch {
    return ''
  }
}
