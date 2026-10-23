// Calcul du prix d'une commande. Ce fichier est utilisé À LA FOIS par le site (affichage du panier,
// via src/lib/pricing.js) et par la fonction serveur `passer-commande`, qui refait le calcul avant
// d'enregistrer : les deux trouvent donc toujours le même total, et un client ne peut pas imposer
// ses propres prix.

// Date du jour en France (AAAA-MM-JJ) : une promo change à minuit heure française, même sur le
// serveur, qui est à l'heure UTC.
export function aujourdhuiParis(date = new Date()) {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(date)
}

export const arrondi = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

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
export function getPromoStatus(product, today = aujourdhuiParis()) {
  if (!product.en_promo || getPromoPercent(product) <= 0) return 'inactive'
  if (product.promo_debut && today < product.promo_debut) return 'scheduled'
  if (product.promo_fin && today > product.promo_fin) return 'expired'
  return 'active'
}

// Déstockage : produit coché "déstockage" avec un prix de déstockage plus bas
// que son prix normal. Passe avant une éventuelle promo.
export function getDestockagePercent(product) {
  if (product.taux_destockage > 0) return product.taux_destockage
  const { en_destockage, prix_destockage, prix_livraison } = product
  if (en_destockage && prix_destockage > 0 && prix_livraison > 0 && prix_destockage < prix_livraison) {
    return (1 - prix_destockage / prix_livraison) * 100
  }
  return 0
}

// Remise effective à appliquer maintenant (déstockage, sinon promo en cours).
export function getDiscountPercent(product, today = aujourdhuiParis()) {
  const destockage = getDestockagePercent(product)
  if (destockage > 0) return destockage
  return getPromoStatus(product, today) === 'active' ? getPromoPercent(product) : 0
}

// Prix "livraison" effectif : prix normal, ou réduit par le déstockage ou la promo en cours.
// C'est ce prix qui sert de base à la remise retrait (les deux se cumulent).
// referencePrice : prix d'un conditionnement choisi plutôt que celui du produit.
export function getBasePrice(product, referencePrice = product.prix_livraison, today = aujourdhuiParis()) {
  const percent = getDiscountPercent(product, today)
  return percent > 0 ? referencePrice * (1 - percent / 100) : referencePrice
}

// Prix unitaire d'un article, arrondi au centime, dans le mode choisi.
export function prixUnitaire(produit, variante, mode, remiseRetrait, today = aujourdhuiParis()) {
  const reference = variante ? variante.prix_livraison : produit.prix_livraison
  const base = getBasePrice(produit, reference, today)
  return arrondi(mode === 'retrait' ? base * (1 - (remiseRetrait || 0) / 100) : base)
}

// Nom enregistré sur la commande (nom « retrait » si renseigné, + conditionnement choisi).
export function nomLigne(produit, variante, mode) {
  const nom = mode === 'retrait' && produit.nom_retrait ? produit.nom_retrait : produit.nom
  return variante?.poids ? `${String(nom).trim()} — ${variante.poids}` : String(nom).trim()
}

// Un article peut-il être commandé dans ce mode ? Renvoie '' si oui, sinon la raison.
export function articleIndisponible(produit, variante, mode) {
  if (!produit || produit.actif === false) return "Ce produit n'est plus en vente."
  if (produit.en_rupture) return 'Ce produit est en rupture de stock.'
  const source = variante || produit
  if (mode === 'retrait' ? source.dispo_retrait === false : source.dispo_livraison === false) {
    return mode === 'retrait' ? "Pas disponible en retrait." : 'Pas disponible en livraison.'
  }
  return ''
}

// Total de la commande.
// lignes : [{ produit, variante, quantite }]
// code : { code, pourcentage } ou null — s'applique sur les produits (cumulable avec tout)
// bon : { id, montant, minimum_commande } ou null — utilisable si les produits atteignent le minimum
export function calculerCommande({ lignes, mode, remiseRetrait, fraisLivraison, code = null, bon = null, today = aujourdhuiParis() }) {
  const detail = lignes.map((l) => {
    const pu = prixUnitaire(l.produit, l.variante, mode, remiseRetrait, today)
    return { ...l, prixUnitaire: pu, totalLigne: arrondi(pu * l.quantite) }
  })
  const sousTotal = arrondi(detail.reduce((s, l) => s + l.totalLigne, 0))
  const remiseCode = code ? arrondi((sousTotal * Number(code.pourcentage)) / 100) : 0
  const bonUtilisable = !!bon && sousTotal >= Number(bon.minimum_commande || 0)
  const remiseBon = bonUtilisable ? Math.min(Number(bon.montant), arrondi(sousTotal - remiseCode)) : 0
  const frais = mode === 'retrait' ? 0 : arrondi(fraisLivraison || 0)
  const total = arrondi(sousTotal - remiseCode - remiseBon + frais)
  return { lignes: detail, sousTotal, remiseCode, remiseBon, bonUtilisable, frais, total }
}
