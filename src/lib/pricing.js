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

// Nom à afficher selon le mode : si un nom spécifique "retrait" a été
// renseigné et qu'on est en mode Retrait, on l'utilise à la place du nom
// normal (utile quand le conditionnement diffère selon le canal, ex :
// "10 tartelettes" en livraison vs "2 tartelettes" en retrait).
export function getDisplayName(product, isPickup) {
  if (isPickup && product.nom_retrait) return product.nom_retrait
  return product.nom
}

// Extrait un poids en kg depuis un texte. Comprend "500 g", "500g",
// "1 kg", "1,5kg", ET le format "2x250g" (nombre d'unités × poids par
// unité, ex: 2 sachets de 250g = 500g au total). Renvoie null si le
// format n'est pas reconnu plutôt que de deviner un mauvais poids.
export function parseWeightToKg(text) {
  if (!text) return null
  const cleaned = String(text).toLowerCase().replace(',', '.').replace(/\s+/g, '')

  const multi = cleaned.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(kg|g|l|ml)$/)
  if (multi) {
    const count = parseFloat(multi[1])
    const qty = parseFloat(multi[2])
    const unit = multi[3]
    const perUnitKg = unit === 'kg' || unit === 'l' ? qty : qty / 1000
    return count * perUnitKg
  }

  const simple = cleaned.match(/^(\d+(?:\.\d+)?)(kg|g|l|ml)$/)
  if (simple) {
    const value = parseFloat(simple[1])
    const unit = simple[2]
    return unit === 'kg' || unit === 'l' ? value : value / 1000
  }

  return null
}

// Prix au kg (ou au litre) affiché sous le produit. Se recalcule en
// permanence à partir du prix actuel si un poids/volume de référence a
// été renseigné ; sinon retombe sur le texte saisi à la main (produits
// plus anciens n'utilisant pas encore ce système).
// weightKgOverride permet de calculer sur le poids réel du conditionnement
// choisi (ex: 250g pour "1x250g") plutôt que sur le poids de référence du
// produit de base — sinon le prix au kg reste faux dès qu'on change de taille.
export function getPricePerUnitLabel(product, referencePrice, weightKgOverride = null) {
  const weightKg =
    weightKgOverride ??
    (product.poids_reference && product.poids_reference > 0 ? product.poids_reference : null)
  if (weightKg) {
    const price = referencePrice ?? product.prix_livraison
    const perUnit = price / weightKg
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
