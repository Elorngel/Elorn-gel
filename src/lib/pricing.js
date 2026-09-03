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
