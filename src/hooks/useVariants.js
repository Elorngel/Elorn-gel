import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useVariants(produitId) {
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchVariants = useCallback(async () => {
    if (!produitId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('variantes_produit')
      .select('*')
      .eq('produit_id', produitId)
      .order('ordre', { ascending: true })

    if (!error) setVariants(data || [])
    setLoading(false)
  }, [produitId])

  useEffect(() => {
    fetchVariants()
  }, [fetchVariants])

  const addVariant = async (poids, prixLivraison) => {
    const { error } = await supabase.from('variantes_produit').insert({
      produit_id: produitId,
      poids,
      prix_livraison: prixLivraison,
      ordre: variants.length,
      est_defaut: variants.length === 0,
    })
    if (error) throw error
    await fetchVariants()
  }

  const updateVariant = async (id, changes) => {
    const { error } = await supabase
      .from('variantes_produit')
      .update(changes)
      .eq('id', id)
    if (error) throw error
    await fetchVariants()
  }

  const deleteVariant = async (id) => {
    const { error } = await supabase.from('variantes_produit').delete().eq('id', id)
    if (error) throw error
    await fetchVariants()
  }

  const setDefault = async (id) => {
    await supabase
      .from('variantes_produit')
      .update({ est_defaut: false })
      .eq('produit_id', produitId)
    await updateVariant(id, { est_defaut: true })
  }

  return { variants, loading, addVariant, updateVariant, deleteVariant, setDefault }
}
