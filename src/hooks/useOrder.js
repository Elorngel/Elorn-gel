import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Envoi de la commande à la fonction serveur `passer-commande`, qui recalcule les prix et applique
// le code promo et le bon d'achat avant d'enregistrer.
export function useOrder() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submitOrder = async (demande) => {
    setSubmitting(true)
    setError(null)

    try {
      const { data, error: errFonction } = await supabase.functions.invoke('passer-commande', { body: demande })
      if (errFonction) {
        let message = "La commande n'a pas pu être enregistrée, réessayez."
        try {
          const corps = await errFonction.context.json()
          if (corps?.erreur) message = corps.erreur
        } catch {
          // réponse illisible : message générique
        }
        throw new Error(message)
      }
      const commande = data.commande

      // L'envoi d'email ne doit jamais faire échouer la commande elle-même :
      // si Resend est mal configuré ou indisponible, la commande reste
      // enregistrée normalement, seul l'email manquera.
      try {
        // La fonction relit elle-même la commande dans la base (on ne lui envoie que son numéro).
        await supabase.functions.invoke('send-order-emails', { body: { commandeId: commande.id } })
      } catch (emailErr) {
        console.error('Email de confirmation non envoyé :', emailErr)
      }

      return commande
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return { submitOrder, submitting, error }
}
