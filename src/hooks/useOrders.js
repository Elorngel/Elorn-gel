import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)

    const { data: commandes, error: commandesError } = await supabase
      .from('commandes')
      .select('*')
      .order('created_at', { ascending: false })

    if (commandesError) {
      setError(commandesError.message)
      setLoading(false)
      return
    }

    const { data: lignes, error: lignesError } = await supabase
      .from('commande_lignes')
      .select('*')

    if (lignesError) {
      setError(lignesError.message)
      setLoading(false)
      return
    }

    const withLines = commandes.map((commande) => ({
      ...commande,
      lignes: lignes.filter((l) => l.commande_id === commande.id),
    }))

    setOrders(withLines)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateStatus = useCallback(async (id, statut) => {
    const { error } = await supabase.from('commandes').update({ statut }).eq('id', id)
    if (error) throw error
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)))
  }, [])

  return { orders, loading, error, refetch: fetchOrders, updateStatus }
}
