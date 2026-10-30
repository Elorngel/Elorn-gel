import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { resizeImageFile, CACHE_UN_AN } from '../lib/imageResize'
import { requeteMemo, oublierRequetes } from '../lib/requeteMemo'

// Extrait le nom de fichier du bucket "photos-produits" à partir d'une URL
// publique, pour pouvoir supprimer l'ancienne photo quand on la remplace.
function storageFileName(url) {
  if (!url) return null
  const marker = '/photos-produits/'
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}

// Colonnes utiles aux pages du site (cartes produits, filtres, panier). Les fiches détaillées
// chargent leur produit à part : inutile de télécharger ici les ingrédients et descriptions
// des 290 produits (plus de 40 % du poids).
const COLONNES_SITE =
  'id, nom, nom_retrait, categorie, sous_categorie, fournisseur, actif, mis_en_avant, en_rupture, ' +
  'en_promo, taux_promo, prix_promo, promo_debut, promo_fin, en_destockage, prix_destockage, ' +
  'prix_livraison, prix_par_kg, poids, poids_reference, unite_reference, tags, dispo_livraison, ' +
  'dispo_retrait, photo_url, photo_zoom, photo_pos_x, photo_pos_y, autres_rayons'

// Produits et conditionnements demandés en même temps (et non l'un après l'autre).
function chargerProduits(leger) {
  return requeteMemo(`produits:${leger ? 'site' : 'complet'}`, async () => {
    const [produits, variantes] = await Promise.all([
      supabase.from('produits').select(leger ? COLONNES_SITE : '*').order('nom', { ascending: true }),
      supabase.from('variantes_produit').select('*'),
    ])
    return { data: produits.data, error: produits.error, variantes: variantes.data || [] }
  })
}

// leger : pour les pages du site (sans ingrédients ni description). L'admin charge tout.
export function useProducts({ leger = false } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(
    async (forcer = true) => {
      setLoading(true)
      if (forcer) oublierRequetes('produits')
      const { data, error, variantes } = await chargerProduits(leger)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const withVariants = data.map((p) => ({
        ...p,
        variantes: variantes.filter((v) => v.produit_id === p.id),
      }))

      setProducts(withVariants)
      setError(null)
      setLoading(false)
    },
    [leger]
  )

  useEffect(() => {
    fetchProducts(false)
  }, [fetchProducts])

  const updateProduct = useCallback(async (id, changes) => {
    // Si la photo change, on retient l'ancienne pour la supprimer du stockage
    // une fois le changement confirmé — sinon elle reste coincée pour toujours
    // (c'est ce qui a fait gonfler le stockage avant le ménage du 01/10/2026).
    let previousPhotoUrl = null
    if (changes.photo_url !== undefined) {
      const { data } = await supabase.from('produits').select('photo_url').eq('id', id).single()
      previousPhotoUrl = data?.photo_url ?? null
    }

    const { error } = await supabase.from('produits').update(changes).eq('id', id)
    if (error) throw error
    oublierRequetes('produits')
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
    )

    if (previousPhotoUrl && previousPhotoUrl !== changes.photo_url) {
      const oldName = storageFileName(previousPhotoUrl)
      if (oldName) {
        // Best-effort : un échec ici ne doit jamais faire échouer la sauvegarde du produit.
        supabase.storage.from('photos-produits').remove([oldName]).catch(() => {})
      }
    }
  }, [])

  const uploadPhoto = useCallback(async (id, file) => {
    const toSend = await resizeImageFile(file)
    const fileExt = toSend.name.split('.').pop()
    const filePath = `${id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos-produits')
      .upload(filePath, toSend, { upsert: true, cacheControl: CACHE_UN_AN })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('photos-produits')
      .getPublicUrl(filePath)

    await updateProduct(id, { photo_url: data.publicUrl })
    return data.publicUrl
  }, [updateProduct])

  const uploadPhotoOnly = useCallback(async (id, file) => {
    const toSend = await resizeImageFile(file)
    const fileExt = toSend.name.split('.').pop()
    const filePath = `${id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('photos-produits')
      .upload(filePath, toSend, { upsert: true, cacheControl: CACHE_UN_AN })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('photos-produits')
      .getPublicUrl(filePath)

    return data.publicUrl
  }, [])

  const createProduct = useCallback(async (defaults = {}) => {
    const { data, error } = await supabase
      .from('produits')
      .insert({
        nom: 'Nouveau produit',
        prix_livraison: 0,
        actif: false,
        ...defaults,
      })
      .select()
      .single()

    if (error) throw error
    await fetchProducts()
    return data
  }, [fetchProducts])

  const deleteProduct = useCallback(async (id) => {
    const { data: produit } = await supabase.from('produits').select('photo_url').eq('id', id).single()

    const { error } = await supabase.from('produits').delete().eq('id', id)
    if (error) throw error
    oublierRequetes('produits')
    setProducts((prev) => prev.filter((p) => p.id !== id))

    const oldName = storageFileName(produit?.photo_url)
    if (oldName) {
      supabase.storage.from('photos-produits').remove([oldName]).catch(() => {})
    }
  }, [])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    updateProduct,
    uploadPhoto,
    uploadPhotoOnly,
    createProduct,
    deleteProduct,
  }
}
