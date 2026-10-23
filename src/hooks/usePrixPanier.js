import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const COLONNES =
  'id, nom, nom_retrait, actif, en_rupture, en_promo, taux_promo, prix_promo, promo_debut, promo_fin, en_destockage, prix_destockage, prix_livraison, dispo_livraison, dispo_retrait'

export const varianteDuPanier = (item) => item.cartKey.split('::')[1] || null

// Prix à jour des articles du panier : le panier garde ce que le client a choisi, mais les prix
// viennent toujours de la base (comme au moment où le serveur enregistre la commande).
export function usePrixPanier(items) {
  const [donnees, setDonnees] = useState({ cle: '', produits: new Map(), variantes: new Map(), erreur: false })
  const produitIds = [...new Set(items.map((i) => i.id))].sort()
  const varianteIds = [...new Set(items.map(varianteDuPanier).filter(Boolean))].sort()
  const cle = `${produitIds.join(',')}|${varianteIds.join(',')}`

  useEffect(() => {
    const [pIds, vIds] = cle.split('|').map((x) => x.split(',').filter(Boolean))
    if (!pIds.length) return
    let annule = false
    Promise.all([
      supabase.from('produits').select(COLONNES).in('id', pIds),
      vIds.length
        ? supabase.from('variantes_produit').select('id, produit_id, poids, prix_livraison, dispo_livraison, dispo_retrait').in('id', vIds)
        : Promise.resolve({ data: [] }),
    ]).then(([p, v]) => {
      if (annule) return
      setDonnees({
        cle,
        produits: new Map((p.data || []).map((x) => [x.id, x])),
        variantes: new Map((v.data || []).map((x) => [x.id, x])),
        erreur: !!(p.error || v.error),
      })
    })
    return () => {
      annule = true
    }
  }, [cle])

  const pret = !produitIds.length || donnees.cle === cle
  return { pret, erreur: donnees.erreur, produits: donnees.produits, variantes: donnees.variantes }
}
