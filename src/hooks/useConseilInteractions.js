import { supabase } from '../lib/supabaseClient'

const INDISPONIBLE = {
  ok: false,
  code: 'indisponible',
  message: 'Le conseil automatique est indisponible pour le moment.',
}

// Journal + question libre de l'assistant de conseil.
export function useConseilInteractions() {
  // Enregistre le parcours au questionnaire (occasion + réponses données).
  // Ne doit jamais gêner le client : en cas d'erreur, on note et on continue.
  const logQuestionnaire = async ({ sessionId, mode, occasion, reponses, selection }) => {
    const { error } = await supabase.from('conseil_interactions').insert({
      session_id: sessionId,
      type: 'questionnaire',
      mode,
      occasion_id: occasion.id,
      occasion_nom: occasion.nom,
      reponses,
      selection_id: selection?.id ?? null,
      selection_trouvee: (selection?.produits.length ?? 0) > 0,
    })
    if (error) console.error('Journal du conseil non enregistré :', error.message)
  }

  // Seul endroit où l'IA intervient : passe par la fonction serveur
  // "conseil-produit" (la clé Claude n'est jamais dans le navigateur).
  // C'est aussi cette fonction qui enregistre la question et la réponse.
  const askQuestion = async ({ question, sessionId, mode, occasionNom, contexte }) => {
    try {
      const { data, error } = await supabase.functions.invoke('conseil-produit', {
        body: { question, session_id: sessionId, mode, occasion: occasionNom, contexte },
      })
      if (error || !data) return INDISPONIBLE
      return data
    } catch (err) {
      console.error('Conseil automatique :', err)
      return INDISPONIBLE
    }
  }

  return { logQuestionnaire, askQuestion }
}
