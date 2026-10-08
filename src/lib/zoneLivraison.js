import { COMMUNES_PAR_CODE_POSTAL } from '../data/communesZone'

// Minuscules, sans accents ni ponctuation, "saint" abrégé : "Saint-Pol-de-Léon" et
// "st pol de leon" donnent le même texte.
function normalise(texte) {
  return (texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(saint|sainte)\b/g, 'st')
    .trim()
}

// Vérifie si on livre à ce code postal.
// `zone` : liste des communes cochées dans l'admin (tableau de noms) ; vide ou absente =
// aucune restriction.
// Renvoie { ok: true } ou { ok: false, raison, desservies } :
//  - raison 'code' : aucune commune desservie n'a ce code postal ;
//  - raison 'commune' : le code est partagé entre une commune desservie et d'autres qui
//    ne le sont pas, et le nom de ville saisi ne correspond à aucune commune desservie
//    (`desservies` liste celles qui le sont).
export function verifierZoneLivraison(zone, codePostal, ville) {
  if (!Array.isArray(zone) || zone.length === 0) return { ok: true }

  const cp = (codePostal || '').trim()
  const communes = COMMUNES_PAR_CODE_POSTAL[cp] || []
  const desservies = communes.filter((nom) => zone.includes(nom))

  if (desservies.length === 0) return { ok: false, raison: 'code', desservies: [] }
  if (desservies.length === communes.length) return { ok: true }

  const saisie = normalise(ville)
  if (saisie && desservies.some((nom) => normalise(nom) === saisie)) return { ok: true }
  return { ok: false, raison: 'commune', desservies }
}
