import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Charge quelques produits (avec leurs conditionnements) à partir de leurs ids,
// dans l'ordre demandé. Les produits masqués sont ignorés.
export function useProductsByIds(ids) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const key = (ids || []).join(',')

  useEffect(() => {
    let cancelled = false
    const wanted = key ? key.split(',') : []

    if (wanted.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const [{ data: produits }, { data: variantes }] = await Promise.all([
        supabase.from('produits').select('*').in('id', wanted).eq('actif', true),
        supabase.from('variantes_produit').select('*').in('produit_id', wanted),
      ])
      if (cancelled) return

      setProducts(
        wanted
          .map((id) => (produits || []).find((p) => p.id === id))
          .filter(Boolean)
          .map((p) => ({ ...p, variantes: (variantes || []).filter((v) => v.produit_id === p.id) }))
      )
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [key])

  return { products, loading }
}
