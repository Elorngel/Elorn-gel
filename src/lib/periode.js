// Période d'affichage des bannières saisonnières (Black Friday, Fêtes) : la case de l'admin dit « oui », les dates
// disent « quand ». Dates « AAAA-MM-JJ » incluses, heure de Paris ; une date vide = pas de limite de ce côté.
import { aujourdhuiParis } from '../../supabase/functions/_shared/calculCommande.js'

export function dansPeriode(debut, fin, jour = aujourdhuiParis()) {
  return (!debut || jour >= debut) && (!fin || jour <= fin)
}

export const dateCourteFr = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR') : '')

// État affiché à côté de la case dans l'admin.
export function etatAffichage(actif, debut, fin, jour = aujourdhuiParis()) {
  if (!actif) return { visible: false, libelle: 'Caché aux clients' }
  if (debut && jour < debut) return { visible: false, programme: true, libelle: `Programmé : s'affichera le ${dateCourteFr(debut)}` }
  if (fin && jour > fin) return { visible: false, libelle: `Terminé le ${dateCourteFr(fin)}` }
  return { visible: true, libelle: fin ? `Visible sur le site jusqu'au ${dateCourteFr(fin)}` : 'Visible sur le site' }
}
