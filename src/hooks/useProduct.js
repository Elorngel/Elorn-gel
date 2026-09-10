import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [associatedProducts, setAssociatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data: productData, error: productError } = await supabase
        .from('produits')
        .select('*')
        .eq('id', id)
        .single()

      if (cancelled) return

      if (productError) {
        setError(productError.message)
        setLoading(false)
        return
      }

      const { data: variantesData } = await supabase
        .from('variantes_produit')
        .select('*')
        .eq('produit_id', id)
        .order('ordre', { ascending: true })

      setProduct({ ...productData, variantes: variantesData || [] })

      const { data: accompRows } = await supabase
        .from('produits_accompagnements')
        .select('*')
        .eq('produit_id', id)
        .order('ordre', { ascending: true })

      const associeIds = (accompRows || []).map((r) => r.produit_associe_id)

      if (associeIds.length > 0) {
        const { data: assocData } = await supabase
          .from('produits')
          .select('*')
          .in('id', associeIds)
          .eq('actif', true)

        if (!cancelled) {
          const ordered = associeIds
            .map((aid) => (assocData || []).find((p) => p.id === aid))
            .filter(Boolean)
          setAssociatedProducts(ordered)
        }
      } else if (!cancelled) {
        setAssociatedProducts([])
      }

      const { data: relatedData } = await supabase
        .from('produits')
        .select('*')
        .eq('categorie', productData.categorie)
        .neq('id', id)
        .eq('actif', true)
        .limit(4)

      if (!cancelled) {
        setRelated(relatedData || [])
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  return { product, related, associatedProducts, loading, error }
}
