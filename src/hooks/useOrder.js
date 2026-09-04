import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useOrder() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const submitOrder = async ({ nomClient, telephone, email, mode, note, creneauRetrait, creneauLivraison, items, total, fraisLivraison }) => {
    setSubmitting(true)
    setError(null)

    try {
      const { data: commande, error: commandeError } = await supabase
        .from('commandes')
        .insert({
          nom_client: nomClient,
          telephone,
          email: email || null,
          mode,
          note: note || null,
          creneau_retrait: creneauRetrait || null,
          creneau_livraison: creneauLivraison || null,
          total,
          frais_livraison: fraisLivraison || 0,
        })
        .select()
        .single()

      if (commandeError) throw commandeError

      const lignes = items.map((item) => ({
        commande_id: commande.id,
        produit_id: item.id,
        nom_produit: item.nom,
        prix_unitaire: item.unitPrice,
        quantite: item.quantity,
      }))

      const { error: lignesError } = await supabase.from('commande_lignes').insert(lignes)
      if (lignesError) throw lignesError

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
