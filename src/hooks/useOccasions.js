import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { MAX_QUESTIONS, MAX_REPONSES, MAX_PRODUITS } from '../lib/occasions'

const byOrdre = (a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)

// Range l'arbre renvoyé par Supabase sous une forme simple à parcourir :
// occasion → questions → réponses, et occasion → sélections → produits.
function normalize(rows) {
  return (rows || []).map((o) => ({
    id: o.id,
    nom: o.nom,
    ordre: o.ordre,
    actif: o.actif,
    questions: (o.occasion_questions || [])
      .slice()
      .sort(byOrdre)
      .map((q) => ({
        id: q.id,
        ordre: q.ordre,
        libelle: q.libelle,
        reponses: (q.occasion_reponses || []).slice().sort(byOrdre),
      })),
    selections: (o.occasion_selections || []).map((s) => ({
      id: s.id,
      reponse_1_id: s.reponse_1_id,
      reponse_2_id: s.reponse_2_id,
      intro: s.intro,
      produits: (s.occasion_selection_produits || []).slice().sort(byOrdre),
    })),
  }))
}

export function useOccasions() {
  const [occasions, setOccasions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // "silencieux" : après une modification on recharge sans afficher
  // "Chargement…", pour ne pas fermer ce que l'admin est en train d'éditer.
  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    const { data, error } = await supabase
      .from('occasions')
      .select(
        '*, occasion_questions(*, occasion_reponses(*)), occasion_selections(*, occasion_selection_produits(*))'
      )
      .order('ordre', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setOccasions(normalize(data))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const run = async (promise) => {
    const { error } = await promise
    if (error) throw error
    await fetchAll({ silent: true })
  }

  // ─── Occasions ───
  const addOccasion = (nom) =>
    run(supabase.from('occasions').insert({ nom, ordre: occasions.length }))
  const renameOccasion = (id, nom) => run(supabase.from('occasions').update({ nom }).eq('id', id))
  const setOccasionActive = (id, actif) =>
    run(supabase.from('occasions').update({ actif }).eq('id', id))
  const deleteOccasion = (id) => run(supabase.from('occasions').delete().eq('id', id))

  // ─── Questions filtres ───
  const addQuestion = (occasion, libelle) => {
    // Premier emplacement libre (0 ou 1) : si on supprime la 1re question,
    // la suivante reprend sa place.
    const ordre = [0, 1].find((o) => !occasion.questions.some((q) => q.ordre === o))
    if (occasion.questions.length >= MAX_QUESTIONS || ordre === undefined) {
      throw new Error(`${MAX_QUESTIONS} questions maximum par occasion.`)
    }
    return run(supabase.from('occasion_questions').insert({ occasion_id: occasion.id, ordre, libelle }))
  }
  const renameQuestion = (id, libelle) =>
    run(supabase.from('occasion_questions').update({ libelle }).eq('id', id))
  const deleteQuestion = (id) => run(supabase.from('occasion_questions').delete().eq('id', id))

  // ─── Réponses ───
  const addReponse = (question, libelle) => {
    if (question.reponses.length >= MAX_REPONSES) {
      throw new Error(`${MAX_REPONSES} réponses maximum par question.`)
    }
    return run(
      supabase
        .from('occasion_reponses')
        .insert({ question_id: question.id, libelle, ordre: question.reponses.length })
    )
  }
  const renameReponse = (id, libelle) =>
    run(supabase.from('occasion_reponses').update({ libelle }).eq('id', id))
  const deleteReponse = (id) => run(supabase.from('occasion_reponses').delete().eq('id', id))

  // ─── Sélections (une par combinaison de réponses) ───
  // Créée à la demande : on n'enregistre rien tant que l'admin n'a pas rempli la combinaison.
  const ensureSelection = async (occasion, r1Id, r2Id, selection) => {
    if (selection) return selection
    const { data, error } = await supabase
      .from('occasion_selections')
      .insert({ occasion_id: occasion.id, reponse_1_id: r1Id ?? null, reponse_2_id: r2Id ?? null })
      .select()
      .single()
    if (error) throw error
    return { ...data, produits: [] }
  }

  const saveIntro = async (occasion, combo, intro) => {
    const selection = await ensureSelection(occasion, combo.r1?.id, combo.r2?.id, combo.selection)
    await run(
      supabase
        .from('occasion_selections')
        .update({ intro: intro.trim() || null })
        .eq('id', selection.id)
    )
  }

  const addProduit = async (occasion, combo, produitId) => {
    const selection = await ensureSelection(occasion, combo.r1?.id, combo.r2?.id, combo.selection)
    if ((selection.produits?.length ?? 0) >= MAX_PRODUITS) {
      throw new Error(`${MAX_PRODUITS} produits maximum par sélection.`)
    }
    await run(
      supabase.from('occasion_selection_produits').insert({
        selection_id: selection.id,
        produit_id: produitId,
        ordre: selection.produits?.length ?? 0,
      })
    )
  }

  const removeProduit = (rowId) =>
    run(supabase.from('occasion_selection_produits').delete().eq('id', rowId))

  return {
    occasions,
    loading,
    error,
    refetch: fetchAll,
    addOccasion,
    renameOccasion,
    setOccasionActive,
    deleteOccasion,
    addQuestion,
    renameQuestion,
    deleteQuestion,
    addReponse,
    renameReponse,
    deleteReponse,
    saveIntro,
    addProduit,
    removeProduit,
  }
}
