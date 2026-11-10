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
// code : { code, pourcentage } ou { code, montant } (remise fixe en euros), avec minimum_commande et mode
// ('retrait' | 'livraison' | null = les deux) facultatifs,
// ou null — s'applique sur les produits (hors frais de livraison)
// bon : { id, montant, minimum_commande } ou null — utilisable si les produits atteignent le minimum
// UN SEUL AVANTAGE PAR COMMANDE (06/11/2026) : code promo et bon d'achat ne se cumulent pas ; si les
// deux sont possibles, on garde automatiquement le plus avantageux pour le client. avantageEcarte dit
// lequel n'a pas été appliqué ('code' ou 'bon'), pour l'expliquer dans le panier. Les promotions et la
// remise retrait, elles, restent cumulables.
// livraisonOfferte : client Privilège (carte annuelle vendue hors site, voir privilegeActif) → pas de frais de
// livraison. Le reste du calcul (minimum de livraison, codes, bons) ne change pas.
export function calculerCommande({ lignes, mode, remiseRetrait, fraisLivraison, code = null, bon = null, livraisonOfferte = false, today = aujourdhuiParis() }) {
  const detail = lignes.map((l) => {
    const pu = prixUnitaire(l.produit, l.variante, mode, remiseRetrait, today)
    return { ...l, prixUnitaire: pu, totalLigne: arrondi(pu * l.quantite) }
  })
  const sousTotal = arrondi(detail.reduce((s, l) => s + l.totalLigne, 0))
  // Code promo : pourcentage des produits, ou montant fixe (jamais plus que les produits), dès son minimum.
  // Code réservé au retrait (ou à la livraison) : sans effet dans l'autre mode.
  const codeMauvaisMode = !!code && !!code.mode && code.mode !== mode
  const codeMinimumAtteint = !!code && sousTotal >= Number(code.minimum_commande || 0)
  let remiseCode = codeMauvaisMode || !codeMinimumAtteint
    ? 0
    : Number(code.montant) > 0
      ? Math.min(arrondi(code.montant), sousTotal)
      : arrondi((sousTotal * Number(code.pourcentage || 0)) / 100)
  const bonUtilisable = !!bon && sousTotal >= Number(bon.minimum_commande || 0)
  let remiseBon = bonUtilisable ? Math.min(Number(bon.montant), sousTotal) : 0
  let avantageEcarte = null
  if (remiseCode > 0 && remiseBon > 0) {
    if (remiseBon >= remiseCode) {
      remiseCode = 0
      avantageEcarte = 'code'
    } else {
      remiseBon = 0
      avantageEcarte = 'bon'
    }
  }
  const privilege = mode !== 'retrait' && !!livraisonOfferte
  const frais = mode === 'retrait' || privilege ? 0 : arrondi(fraisLivraison || 0)
  const total = arrondi(sousTotal - remiseCode - remiseBon + frais)
  const codeSousMinimum = !!code && !codeMauvaisMode && !codeMinimumAtteint
  return { lignes: detail, sousTotal, remiseCode, codeSousMinimum, codeMauvaisMode, remiseBon, bonUtilisable, avantageEcarte, privilege, frais, total }
}

// Montant de produits (promos et remise retrait comprises, avant code promo et bon d'achat) qu'il manque
// pour atteindre le minimum de commande en livraison. 0 = minimum atteint, ou retrait.
export function manqueLivraison(sousTotal, mode, minimum) {
  if (mode === 'retrait') return 0
  return Math.max(0, arrondi(Number(minimum || 0) - Number(sousTotal || 0)))
}

// Le client a-t-il 18 ans ? (date de naissance au format AAAA-MM-JJ). Date absente ou illisible = non.
export function estMajeur(dateNaissance, today = aujourdhuiParis()) {
  const m = String(dateNaissance || '').match(/^(\d{4})-(\d{2}-\d{2})/)
  if (!m) return false
  return today >= `${Number(m[1]) + 18}-${m[2]}`
}

// Carte Privilège : achetée le jour « debut » (AAAA-MM-JJ), valable 1 an, jusqu'à la veille du même jour l'année
// suivante (achetée le 07/11/2026 → valable jusqu'au 06/11/2027 inclus). Renvoie cette dernière date, ou null.
export function finPrivilege(debut) {
  const m = String(debut || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]) + 1, Number(m[2]) - 1, Number(m[3])))
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function privilegeActif(debut, today = aujourdhuiParis()) {
  const fin = finPrivilege(debut)
  return !!fin && today >= String(debut).slice(0, 10) && today <= fin
}

// « -10 % » ou « -5,00 € » : libellé d'un code promo.
export function libelleRemiseCode(code) {
  if (!code) return ''
  if (Number(code.montant) > 0) return `-${Number(code.montant).toFixed(2).replace('.', ',')} €`
  return `-${Number(code.pourcentage)} %`
}
