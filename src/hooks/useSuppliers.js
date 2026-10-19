import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { resizeImageFile, CACHE_UN_AN } from '../lib/imageResize'

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('fournisseurs')
      .select('*')
      .order('nom', { ascending: true })
    setSuppliers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const addSupplier = async (nom) => {
    const { data, error } = await supabase
      .from('fournisseurs')
      .insert({ nom: nom.trim() })
      .select()
      .single()
    if (error) throw error
    await fetchAll()
    return data
  }

  const updateSupplier = async (id, changes) => {
    const { error } = await supabase.from('fournisseurs').update(changes).eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const deleteSupplier = async (id) => {
    const { error } = await supabase.from('fournisseurs').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const uploadLogo = async (id, file) => {
    // Les logos s'affichent en 80 px au plus : 400 px suffisent largement, même zoomés
    // et sur écran Retina (un logo de 2 600 px pesait jusqu'à 1 Mo).
    const toSend = await resizeImageFile(file, { maxDimension: 400, quality: 0.92, garderPng: true })
    const fileExt = toSend.name.split('.').pop()
    const filePath = `fournisseur-${id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos-produits')
      .upload(filePath, toSend, { upsert: true, cacheControl: CACHE_UN_AN })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('photos-produits').getPublicUrl(filePath)
    return data.publicUrl
  }

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    uploadLogo,
    refetch: fetchAll,
  }
}
