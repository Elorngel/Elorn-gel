import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAccompagnements(produitId) {
  const [items, setItems] = useState([]) // [{ id, produit_associe_id, ordre }]
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!produitId) return
    setLoading(true)
    const { data } = await supabase
      .from('produits_accompagnements')
      .select('*')
      .eq('produit_id', produitId)
      .order('ordre', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }, [produitId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addAssociation = async (produitAssocieId) => {
    const { error } = await supabase.from('produits_accompagnements').insert({
      produit_id: produitId,
      produit_associe_id: produitAssocieId,
      ordre: items.length,
    })
    if (error) throw error
    await fetchAll()
  }

  const removeAssociation = async (rowId) => {
    const { error } = await supabase
      .from('produits_accompagnements')
      .delete()
      .eq('id', rowId)
    if (error) throw error
    await fetchAll()
  }

  return { items, loading, addAssociation, removeAssociation, refetch: fetchAll }
}
