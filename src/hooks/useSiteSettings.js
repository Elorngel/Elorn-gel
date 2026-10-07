import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { resizeImageFile } from '../lib/imageResize'

function storageFileName(url) {
  if (!url) return null
  const marker = '/photos-produits/'
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

// Champs "image" des réglages : quand l'un change, l'ancienne photo peut être supprimée.
const IMAGE_FIELDS = ['hero_url', 'logo_url']

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
    // Si la photo vitrine ou le logo change, on retient l'ancienne pour la
    // supprimer du stockage une fois le changement confirmé.
    const changedImageFields = IMAGE_FIELDS.filter((f) => changes[f] !== undefined)
    let previous = null
    if (changedImageFields.length > 0) {
      const { data } = await supabase.from('parametres_site').select(changedImageFields.join(',')).eq('id', 1).single()
      previous = data
    }

    const { error } = await supabase
      .from('parametres_site')
      .update(changes)
      .eq('id', 1)
    if (error) throw error
    setSettings((prev) => ({ ...prev, ...changes }))

    changedImageFields.forEach((f) => {
      if (previous?.[f] && previous[f] !== changes[f]) {
        const oldName = storageFileName(previous[f])
        if (oldName) supabase.storage.from('photos-produits').remove([oldName]).catch(() => {})
      }
    })
  }, [])

  const uploadSiteImage = useCallback(async (file, prefix) => {
    const toSend = await resizeImageFile(file)
    const fileExt = toSend.name.split('.').pop()
    const filePath = `${prefix}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos-produits')
      .upload(filePath, toSend, { upsert: true })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('photos-produits').getPublicUrl(filePath)
    return data.publicUrl
  }, [])

  // Reprend une photo déjà stockée sur le site (ex : photo d'un produit) en
  // en faisant une COPIE côté stockage : la photo vitrine a ainsi son propre
  // fichier, et supprimer ou remplacer la photo du produit ne l'affecte pas
  // (et inversement, grâce au nettoyage de l'ancien fichier à chaque changement).
  const copySiteImage = useCallback(async (sourceUrl, prefix) => {
    const sourceName = storageFileName(sourceUrl)
    if (!sourceName) throw new Error("Cette photo n'est pas stockée sur le site.")
    const ext = sourceName.split('.').pop()
    const filePath = `${prefix}-${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('photos-produits').copy(sourceName, filePath)
    if (error) throw error

    const { data } = supabase.storage.from('photos-produits').getPublicUrl(filePath)
    return data.publicUrl
  }, [])

  return { settings, loading, updateSettings, uploadSiteImage, copySiteImage }
}
