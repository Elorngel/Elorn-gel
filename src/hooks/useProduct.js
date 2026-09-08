import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [associatedProduct, setAssociatedProduct] = useState(null)
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

      if (productData.produit_associe_id) {
        const { data: associeData } = await supabase
          .from('produits')
          .select('*')
          .eq('id', productData.produit_associe_id)
          .eq('actif', true)
          .single()
        if (!cancelled) setAssociatedProduct(associeData || null)
      } else {
        setAssociatedProduct(null)
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

  return { product, related, associatedProduct, loading, error }
}
