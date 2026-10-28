import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [associatedProducts, setAssociatedProducts] = useState([])
  const [supplierLogo, setSupplierLogo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      // L'adresse de la page ne contient que les 8 premiers caractères de l'identifiant
      // (/produit/filet-cabillaud-4cef388c) : on cherche le produit dont l'identifiant commence ainsi.
      const court = /^[0-9a-f]{8}$/i.test(id)
      const requete = supabase.from('produits').select('*')
      const { data: productData, error: productError } = await (court
        ? requete.gte('id', `${id}-0000-0000-0000-000000000000`).lte('id', `${id}-ffff-ffff-ffff-ffffffffffff`).limit(1).single()
        : requete.eq('id', id).single())

      if (cancelled) return

      if (productError) {
        setError(productError.message)
        setLoading(false)
        return
      }

      const { data: variantesData } = await supabase
        .from('variantes_produit')
        .select('*')
        .eq('produit_id', productData.id)
        .order('ordre', { ascending: true })

      setProduct({ ...productData, variantes: variantesData || [] })

      if (productData.fournisseur) {
        const { data: fournisseurData } = await supabase
          .from('fournisseurs')
          .select('*')
          .ilike('nom', productData.fournisseur.trim())
          .maybeSingle()
        if (!cancelled) setSupplierLogo(fournisseurData?.logo_url ? fournisseurData : null)
      } else if (!cancelled) {
        setSupplierLogo(null)
      }

      const { data: accompRows } = await supabase
        .from('produits_accompagnements')
        .select('*')
        .eq('produit_id', productData.id)
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
        .neq('id', productData.id)
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

  return { product, related, associatedProducts, supplierLogo, loading, error }
}
