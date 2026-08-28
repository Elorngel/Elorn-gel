import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('produits')
      .select('*')
      .order('nom', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setProducts(data)
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const updateProduct = useCallback(async (id, changes) => {
    const { error } = await supabase.from('produits').update(changes).eq('id', id)
    if (error) throw error
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    )
  }, [])

  const uploadPhoto = useCallback(async (id, file) => {
    const fileExt = file.name.split('.').pop()
    const filePath = `${id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos-produits')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('photos-produits')
      .getPublicUrl(filePath)

    await updateProduct(id, { photo_url: data.publicUrl })
    return data.publicUrl
  }, [updateProduct])

  return { products, loading, error, refetch: fetchProducts, updateProduct, uploadPhoto }
}
