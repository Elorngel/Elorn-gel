import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { requeteMemo, oublierRequetes } from '../lib/requeteMemo'

export function useCategories() {
  const [categoriesFull, setCategoriesFull] = useState([])
  const [subcategoriesFull, setSubcategoriesFull] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (forcer = true) => {
    setLoading(true)
    if (forcer) oublierRequetes('categories')
    // Catégories et sous-catégories en même temps, et une seule fois pour toute la page.
    const [{ data: cats }, { data: subs }] = await requeteMemo('categories', () =>
      Promise.all([
        supabase.from('categories').select('*').order('ordre', { ascending: true }),
        supabase.from('sous_categories').select('*').order('ordre', { ascending: true }),
      ])
    )
    setCategoriesFull(cats || [])
    setSubcategoriesFull(subs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll(false)
  }, [fetchAll])

  // Formes simples, compatibles avec ce qu'utilisaient déjà le header,
  // le catalogue et l'admin (liste de noms + regroupement par catégorie).
  const categories = categoriesFull.map((c) => c.nom)

  const subcategoriesByCategory = {}
  categoriesFull.forEach((c) => {
    subcategoriesByCategory[c.nom] = subcategoriesFull
      .filter((s) => s.categorie_id === c.id)
      .map((s) => s.nom)
  })

  const addCategory = async (nom) => {
    const { error } = await supabase
      .from('categories')
      .insert({ nom, ordre: categoriesFull.length })
    if (error) throw error
    await fetchAll()
  }

  const renameCategory = async (id, oldNom, newNom) => {
    const { error } = await supabase.from('categories').update({ nom: newNom }).eq('id', id)
    if (error) throw error
    // Met aussi à jour les produits déjà classés dans cette catégorie,
    // pour ne pas les rendre orphelins.
    await supabase.from('produits').update({ categorie: newNom }).eq('categorie', oldNom)
    await fetchAll()
  }

  const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  const addSubcategory = async (categorieId, nom) => {
    const ordre = subcategoriesFull.filter((s) => s.categorie_id === categorieId).length
    const { error } = await supabase
      .from('sous_categories')
      .insert({ categorie_id: categorieId, nom, ordre })
    if (error) throw error
    await fetchAll()
  }

  const renameSubcategory = async (id, oldNom, newNom) => {
    const { error } = await supabase
      .from('sous_categories')
      .update({ nom: newNom })
      .eq('id', id)
    if (error) throw error
    await supabase.from('produits').update({ sous_categorie: newNom }).eq('sous_categorie', oldNom)
    await fetchAll()
  }

  const deleteSubcategory = async (id) => {
    const { error } = await supabase.from('sous_categories').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  return {
    categoriesFull,
    subcategoriesFull,
    categories,
    subcategoriesByCategory,
    loading,
    addCategory,
    renameCategory,
    deleteCategory,
    addSubcategory,
    renameSubcategory,
    deleteSubcategory,
    refetch: fetchAll,
  }
}
