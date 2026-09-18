// Retrouve le fournisseur correspondant au champ texte "fournisseur" d'un
// produit, dans une liste de fournisseurs déjà chargée (voir useSuppliers).
// Comparaison insensible à la casse et aux espaces, comme côté fiche produit
// (useProduct.js, qui fait le même travail via une requête Supabase .ilike).
// Renvoie null si aucun fournisseur ne correspond, ou s'il n'a pas de logo.
export function getSupplierLogo(suppliers, fournisseurName) {
  if (!fournisseurName || !suppliers) return null
  const needle = fournisseurName.trim().toLowerCase()
  if (!needle) return null
  const match = suppliers.find((s) => (s.nom || '').trim().toLowerCase() === needle)
  return match?.logo_url ? match : null
}
