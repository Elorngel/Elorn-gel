// Renvoie le prix "livraison" effectif d'un produit : son prix normal,
// ou son prix réduit s'il est en promo. C'est CE prix qui sert ensuite de
// base au calcul de la remise retrait (les deux se cumulent).
// referencePrice permet de calculer sur le prix d'un conditionnement
// choisi plutôt que sur le prix de base du produit.
export function getBasePrice(product, referencePrice = product.prix_livraison) {
  if (product.en_promo && product.taux_promo > 0) {
    return referencePrice * (1 - product.taux_promo / 100)
  }
  return referencePrice
}

// Renvoie le conditionnement à afficher par défaut dans le catalogue
// (celui coché "par défaut"), ou null si le produit n'a pas de variantes.
export function getDefaultVariant(product) {
  if (!product.variantes || product.variantes.length === 0) return null
  return product.variantes.find((v) => v.est_defaut) || product.variantes[0]
}

// Un produit (sans variantes) est-il disponible dans le mode courant ?
export function isProductAvailable(product, isPickup) {
  return isPickup ? product.dispo_retrait !== false : product.dispo_livraison !== false
}

// Prix au kg (ou au litre) affiché sous le produit. Se recalcule en
// permanence à partir du prix actuel si un poids/volume de référence a
// été renseigné ; sinon retombe sur le texte saisi à la main (produits
// plus anciens n'utilisant pas encore ce système).
export function getPricePerUnitLabel(product, referencePrice) {
  if (product.poids_reference && product.poids_reference > 0) {
    const price = referencePrice ?? product.prix_livraison
    const perUnit = price / product.poids_reference
    return `${perUnit.toFixed(2)} €/${product.unite_reference || 'kg'}`
  }
  return product.prix_par_kg || null
}

// Liste des conditionnements disponibles dans le mode courant.
export function getAvailableVariants(product, isPickup) {
  if (!product.variantes) return []
  return product.variantes.filter((v) =>
    isPickup ? v.dispo_retrait !== false : v.dispo_livraison !== false
  )
}
