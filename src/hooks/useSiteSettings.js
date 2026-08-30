import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSiteSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('parametres_site')
      .select('*')
      .eq('id', 1)
      .single()

    if (!error) setSettings(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = useCallback(async (changes) => {
    const { error } = await supabase
      .from('parametres_site')
      .update(changes)
      .eq('id', 1)
    if (error) throw error
    setSettings((prev) => ({ ...prev, ...changes }))
  }, [])

  const uploadSiteImage = useCallback(async (file, prefix) => {
    const fileExt = file.name.split('.').pop()
    const filePath = `${prefix}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos-produits')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('photos-produits').getPublicUrl(filePath)
    return data.publicUrl
  }, [])

  return { settings, loading, updateSettings, uploadSiteImage }
}
