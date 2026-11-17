import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { requeteMemo, oublierRequetes } from '../lib/requeteMemo'
import { rayonsApresRenommage, rayonsApresSuppression } from '../lib/rayons'

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

  const nomDuRayonParent = (sousId) => {
    const sous = subcategoriesFull.find((s) => s.id === sousId)
    return categoriesFull.find((c) => c.id === sous?.categorie_id)?.nom
  }

  // Rayon renommé ou supprimé : on répercute sur les produits qui y sont en rayon supplémentaire.
  const majAutresRayons = async (transformer) => {
    const { data } = await supabase.from('produits').select('id, autres_rayons').neq('autres_rayons', '[]')
    for (const p of data || []) {
      const suite = transformer(p.autres_rayons || [])
      if (suite) await supabase.from('produits').update({ autres_rayons: suite }).eq('id', p.id)
    }
    oublierRequetes('produits')
  }

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
    await majAutresRayons((liste) => rayonsApresRenommage(liste, oldNom, newNom))
    await fetchAll()
  }

  const deleteCategory = async (id) => {
    const nom = categoriesFull.find((c) => c.id === id)?.nom
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await majAutresRayons((liste) => rayonsApresSuppression(liste, nom))
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
    const categorie = nomDuRayonParent(id)
    await majAutresRayons((liste) => rayonsApresRenommage(liste, categorie, categorie, oldNom, newNom))
    await fetchAll()
  }

  const deleteSubcategory = async (id) => {
    const categorie = nomDuRayonParent(id)
    const nom = subcategoriesFull.find((s) => s.id === id)?.nom
    const { error } = await supabase.from('sous_categories').delete().eq('id', id)
    if (error) throw error
    await majAutresRayons((liste) => rayonsApresSuppression(liste, categorie, nom))
    await fetchAll()
  }

  // Ordre des rayons dans le menu / des sous-catégories dans leur rayon (17/11/2026) : on déplace d'un cran puis on
  // renumérote 0, 1, 2… (seules les lignes dont le numéro change sont enregistrées).
  const renumeroter = async (table, liste, id, sens) => {
    const i = liste.findIndex((x) => x.id === id)
    const j = i + sens
    if (i < 0 || j < 0 || j >= liste.length) return
    const suite = [...liste]
    ;[suite[i], suite[j]] = [suite[j], suite[i]]
    const changes = suite.map((x, n) => ({ id: x.id, ordre: n })).filter((x, n) => suite[n].ordre !== n)
    for (const c of changes) {
      const { error } = await supabase.from(table).update({ ordre: c.ordre }).eq('id', c.id)
      if (error) throw error
    }
    await fetchAll()
  }
  const moveCategory = (id, sens) => renumeroter('categories', categoriesFull, id, sens)
  const moveSubcategory = (id, sens) => {
    const parent = subcategoriesFull.find((s) => s.id === id)?.categorie_id
    return renumeroter('sous_categories', subcategoriesFull.filter((s) => s.categorie_id === parent), id, sens)
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
    moveCategory,
    moveSubcategory,
    refetch: fetchAll,
  }
}
