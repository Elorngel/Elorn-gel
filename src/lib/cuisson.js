// Temps de cuisson : stockés dans Supabase sous forme de texte lisible
// (temps_four, temps_poele, etc.), par exemple :
//   "20 min à 180°C"                       four, airfryer, friteuse
//   "10-15 min à 180°C"                    durée sous forme de plage
//   "20 min à 900W"                        micro-ondes
//   "5 min à feu vif puis 10 min à feu moyen"   poêle, en plusieurs étapes
// Côté admin, chaque mode se saisit en une ou plusieurs "étapes"
// { duree, reglage } ; ces fonctions font le va-et-vient entre les deux.

// Ce que règle chaque mode : une température (°C), une puissance (W) ou
// une intensité de feu en texte libre.
export const CUISSON_REGLAGE = {
  four: 'temp',
  airfryer: 'temp',
  friteuse: 'temp',
  micro_ondes: 'watts',
  poele: 'feu',
}

// Libellés et aides pour le formulaire admin, par type de réglage.
export const REGLAGE_INFO = {
  temp: { suffixe: '°C', placeholder: '180' },
  watts: { suffixe: 'W', placeholder: '900' },
  feu: { suffixe: '', placeholder: 'feu moyen' },
}

// Suggestions proposées dans le champ "feu" (le texte reste libre).
export const FEUX_SUGGERES = ['feu doux', 'feu moyen', 'feu vif']

const SEPARATEUR = /\s+puis\s+/i

// "10", "10-15", "10 à 15" -> "10", "10-15", "10-15"
function normaliseDuree(texte) {
  const t = (texte || '').trim()
  if (!t) return ''
  return t.replace(/^(\d+)\s*(?:-|–|—|à)\s*(\d+)$/, '$1-$2').replace(/\s*min(?:utes?)?$/i, '')
}

// Un réglage saisi "à la main" est mis au format du mode quand c'est possible :
// "180" -> "180°C", "900 w" -> "900W", "à feu doux" -> "feu doux".
function normaliseReglage(texte, type) {
  const t = (texte || '').trim()
  if (!t) return ''
  if (type === 'temp') {
    const m = t.match(/^(\d+)\s*(?:°\s*c?|c|degrés?)?$/i)
    return m ? `${m[1]}°C` : t
  }
  if (type === 'watts') {
    const m = t.match(/^(\d+)\s*(?:w|watts?)?$/i)
    return m ? `${m[1]}W` : t
  }
  return t.replace(/^à\s+/i, '')
}

// Pour pré-remplir le champ : on retire l'unité (le formulaire l'affiche à côté).
function reglagePourChamp(texte, type) {
  const t = (texte || '').trim()
  if (type === 'temp') {
    const m = t.match(/^(\d+)\s*(?:°\s*c?|c|degrés?)$/i)
    return m ? m[1] : t
  }
  if (type === 'watts') {
    const m = t.match(/^(\d+)\s*(?:w|watts?)$/i)
    return m ? m[1] : t
  }
  return t
}

// "5 min à feu vif puis 10 min à feu moyen"
//   -> [{ duree: '5', reglage: 'feu vif' }, { duree: '10', reglage: 'feu moyen' }]
// Renvoie toujours au moins une étape (vide) pour que le formulaire ait une ligne.
// Un texte qu'on ne sait pas découper est conservé tel quel dans "reglage".
export function parseCuisson(value, key) {
  const type = CUISSON_REGLAGE[key] || 'feu'
  const brut = (value || '').trim()
  if (!brut) return [{ duree: '', reglage: '' }]

  return brut.split(SEPARATEUR).map((etape) => {
    const m = etape.match(/^\s*(\d+(?:\s*(?:-|–|—|à)\s*\d+)?)\s*(?:min(?:utes?)?)?\s*(?:à\s+)?(.*)$/i)
    if (!m) return { duree: '', reglage: etape.trim() }
    return { duree: normaliseDuree(m[1]), reglage: reglagePourChamp(m[2], type) }
  })
}

// [{ duree: '10-15', reglage: '180' }] -> "10-15 min à 180°C"
// Les étapes vides sont ignorées ; une étape sans durée garde son texte tel quel.
export function composeCuisson(etapes, key) {
  const type = CUISSON_REGLAGE[key] || 'feu'
  return etapes
    .map(({ duree, reglage }) => {
      const d = normaliseDuree(duree)
      const r = normaliseReglage(reglage, type)
      if (!d) return r
      return r ? `${d} min à ${r}` : `${d} min`
    })
    .filter(Boolean)
    .join(' puis ')
}

// Pour l'affichage sur la fiche : une ligne par étape.
// "5 min à feu vif puis 10 min à feu moyen" -> ["5 min à feu vif", "puis 10 min à feu moyen"]
export function splitCuissonEtapes(value) {
  return (value || '')
    .split(SEPARATEUR)
    .map((etape, i) => (i === 0 ? etape.trim() : `puis ${etape.trim()}`))
    .filter(Boolean)
}
