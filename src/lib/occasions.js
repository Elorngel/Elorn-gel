// Règles du questionnaire de conseil, partagées entre l'admin (onglet
// "Occasions") et l'assistant affiché aux clients.

// Arbre volontairement court : 2 questions filtres, quelques réponses chacune.
// Avec 2 questions de 4 réponses, une occasion compte au plus 16 combinaisons.
export const MAX_QUESTIONS = 2
export const MAX_REPONSES = 4
export const MAX_PRODUITS = 6
export const MIN_PRODUITS = 2

// Une question sans aucune réponse n'est pas posée au client.
export function getQuestionsPosees(occasion) {
  return occasion.questions.filter((q) => q.reponses.length > 0)
}

// Cherche la sélection correspondant à un choix de réponses.
// r1 = réponse à la question d'ordre 0 (ou null si elle n'est pas posée),
// r2 = idem pour la question d'ordre 1.
export function findSelection(occasion, r1Id, r2Id) {
  return (
    occasion.selections.find(
      (s) => (s.reponse_1_id ?? null) === (r1Id ?? null) && (s.reponse_2_id ?? null) === (r2Id ?? null)
    ) || null
  )
}

// Toutes les combinaisons de réponses possibles d'une occasion, dans l'ordre
// d'affichage, chacune avec sa sélection (ou null si elle n'est pas remplie).
export function getCombinaisons(occasion) {
  const [q1, q2] = [0, 1].map((ordre) => occasion.questions.find((q) => q.ordre === ordre))
  const options = (q) => (q && q.reponses.length > 0 ? q.reponses : [null])

  const combos = []
  for (const r1 of options(q1)) {
    for (const r2 of options(q2)) {
      combos.push({
        key: `${r1?.id ?? '-'}|${r2?.id ?? '-'}`,
        r1,
        r2,
        libelle: [r1?.libelle, r2?.libelle].filter(Boolean).join(' · ') || 'Toutes les réponses',
        selection: findSelection(occasion, r1?.id, r2?.id),
      })
    }
  }
  return combos
}
