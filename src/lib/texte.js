// Comparaison de textes pour les recherches : sans tenir compte des accents, des majuscules ni de la
// ponctuation (« cone » trouve « CÔNES », « saint jacques » trouve « SAINT-JACQUES », « coeur » trouve « cœur »).
export function normaliser(texte) {
  return String(texte || '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Tous les mots cherchés se retrouvent-ils dans le texte, dans n'importe quel ordre ?
// Le « s » final d'un mot cherché est ignoré : « cones » trouve aussi « CÔNE ».
export function correspond(texte, recherche) {
  const cible = normaliser(texte)
  const mots = normaliser(recherche).split(' ').filter(Boolean)
  return mots.length > 0 && mots.every((m) => cible.includes(m.length > 3 ? m.replace(/s$/, '') : m))
}
