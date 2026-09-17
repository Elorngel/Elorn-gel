// Format figé pour les temps de cuisson : "X min à Y°C" (température
// optionnelle). Ces deux fonctions permettent de stocker toujours la même
// chaîne de texte dans Supabase (temps_four, temps_poele, etc.) tout en
// proposant, côté admin, deux petits champs numériques séparés au lieu
// d'un champ libre à retaper en entier à chaque fois.

// "20 min à 180°C" -> { min: '20', temp: '180' }
// "10 min"         -> { min: '10', temp: '' }
// ""                -> { min: '', temp: '' }
export function parseCuissonValue(value) {
  if (!value) return { min: '', temp: '' }
  const match = value.match(/^\s*(\d+)\s*min(?:\s*à\s*(\d+)\s*°?\s*c?)?\s*$/i)
  if (!match) return { min: '', temp: '' }
  return { min: match[1], temp: match[2] || '' }
}

// { min: '20', temp: '180' } -> "20 min à 180°C"
// { min: '10', temp: '' }    -> "10 min"
// { min: '', temp: '180' }   -> "" (une température seule n'a pas de sens)
export function composeCuissonValue(min, temp) {
  const m = (min || '').trim()
  const t = (temp || '').trim()
  if (!m) return ''
  return t ? `${m} min à ${t}°C` : `${m} min`
}
