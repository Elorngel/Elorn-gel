// Date du jour au format AAAA-MM-JJ, à l'heure locale (pas UTC, sinon la
// promo changerait à 1h ou 2h du matin au lieu de minuit).
function todayLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Pourcentage de remise d'une promo, quelle que soit sa période. Si un prix
// promo a été saisi, on en déduit le pourcentage équivalent par rapport au
// prix normal du produit (appliqué ensuite à chaque conditionnement).
export function getPromoPercent(product) {
  const { prix_promo, prix_livraison } = product
  if (prix_promo > 0 && prix_livraison > 0 && prix_promo < prix_livraison) {
    return (1 - prix_promo / prix_livraison) * 100
  }
  return product.taux_promo > 0 ? product.taux_promo : 0
}

// 'inactive' (promo non cochée ou sans remise), 'scheduled' (début à venir),
// 'active' ou 'expired'. Les dates de début et de fin sont incluses ; une
// date vide = pas de limite de ce côté.
export function getPromoStatus(product, today = todayLocal()) {
  if (!product.en_promo || getPromoPercent(product) <= 0) return 'inactive'
  if (product.promo_debut && today < product.promo_debut) return 'scheduled'
  if (product.promo_fin && today > product.promo_fin) return 'expired'
  return 'active'
}

export function isPromoActive(product) {
  return getPromoStatus(product) === 'active'
}

// Déstockage : produit coché "déstockage" avec un prix de déstockage plus bas
// que son prix normal. Passe avant une éventuelle promo. Un article déjà dans
// le panier garde son pourcentage dans `taux_destockage`.
export function getDestockagePercent(product) {
  if (product.taux_destockage > 0) return product.taux_destockage
  const { en_destockage, prix_destockage, prix_livraison } = product
  if (en_destockage && prix_destockage > 0 && prix_livraison > 0 && prix_destockage < prix_livraison) {
    return (1 - prix_destockage / prix_livraison) * 100
  }
  return 0
}

export function isDestockage(product) {
  return getDestockagePercent(product) > 0
}

// Remise effective à appliquer maintenant (déstockage, sinon promo en cours).
export function getDiscountPercent(product) {
  if (isDestockage(product)) return getDestockagePercent(product)
  return isPromoActive(product) ? getPromoPercent(product) : 0
}

// Renvoie le prix "livraison" effectif d'un produit : son prix normal,
// ou son prix réduit s'il est en déstockage ou en promo (dans sa période de
// validité). C'est CE prix qui sert ensuite de base au calcul de la remise
// retrait (les deux se cumulent).
// referencePrice permet de calculer sur le prix d'un conditionnement
// choisi plutôt que sur le prix de base du produit.
export function getBasePrice(product, referencePrice = product.prix_livraison) {
  const percent = getDiscountPercent(product)
  return percent > 0 ? referencePrice * (1 - percent / 100) : referencePrice
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

// Déduit l'unité d'affichage (kg ou l) depuis un texte de poids/volume comme
// "500 g", "1,5kg" ou "2x1l" — pour que le prix au kg/litre affiché utilise
// la bonne unité même quand il est calculé à partir d'un conditionnement
// (ex : variante "6 l") plutôt que du champ "Prix au poids" de la fiche produit.
export function parseWeightUnit(text) {
  if (!text) return null
  const cleaned = String(text).toLowerCase().replace(',', '.').replace(/\s+/g, '')

  const multi = cleaned.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(kg|g|l|ml)$/)
  if (multi) return multi[3] === 'l' || multi[3] === 'ml' ? 'l' : 'kg'

  const simple = cleaned.match(/^(\d+(?:\.\d+)?)(kg|g|l|ml)$/)
  if (simple) return simple[2] === 'l' || simple[2] === 'ml' ? 'l' : 'kg'

  return null
}

// Prix au kg (ou au litre) affiché sous le produit. Se recalcule en
// permanence à partir du prix actuel si un poids/volume de référence a
// été renseigné ; sinon retombe sur le texte saisi à la main (produits
// plus anciens n'utilisant pas encore ce système).
// weightKgOverride permet de calculer sur le poids réel du conditionnement
// choisi (ex: 250g pour "1x250g") plutôt que sur le poids de référence du
// produit de base — sinon le prix au kg reste faux dès qu'on change de taille.
// unitOverride fait pareil pour l'unité (kg ou l) : un conditionnement en
// litres (ex: variante "6 l") doit afficher "€/l", pas retomber sur le champ
// "Unité" de la fiche produit (pensé pour le poids de référence, pas les
// conditionnements).
export function getPricePerUnitLabel(product, referencePrice, weightKgOverride = null, unitOverride = null) {
  const weightKg =
    weightKgOverride ??
    (product.poids_reference && product.poids_reference > 0 ? product.poids_reference : null)
  if (weightKg) {
    const price = referencePrice ?? product.prix_livraison
    const perUnit = price / weightKg
    const unit = unitOverride || product.unite_reference || 'kg'
    return `${perUnit.toFixed(2)} €/${unit}`
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
