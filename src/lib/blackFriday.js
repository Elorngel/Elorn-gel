// « Mode Black Friday » (13/11/2026, maquette 2 « Ticket de caisse » choisie par Romuald) : bannière d'accueil activable
// dans l'admin (onglet « Black Friday »). Réglages : parametres_site.black_actif (case) et parametres_site.black (contenu).
// Les prix du ticket sont les vraies promotions des fiches produits (prix promo + dates) : un produit sans promo en cours
// n'apparaît pas sur le ticket côté clients. Prioritaire sur le mode fêtes si les deux sont cochés.
import { getBasePrice, getDiscountPercent, getVarianteAffichee } from './pricing'

export const BLACK_DEFAUT = {
  sur: 'Black Week · 23 → 29 novembre',
  titre1: 'Black',
  titre2: 'Friday',
  texte: 'Toute la semaine, une sélection de surgelés à prix cassés. Livrés chez vous ou à retirer au dépôt de Plouédern.',
  bouton: "J'en profite",
  lien: '/promotions',
  menu: 'Black Week',
  produits: [
    '834da703-a014-455f-8037-299f911247ea', // 6 coquilles Saint-Jacques
    'a51290b8-3c52-4939-9830-5e1c22a7a4cb', // 25 mini quiches apéritives
    'ef0cba66-10fe-4a67-a81a-65838a02b67e', // chipolatas artisanales
    'c4b1d987-b09a-4bd1-9ab5-99e8aadb4911', // cœur de filet de merlu
    'f4d77846-a9b2-4aed-9795-5699b55a5f0e', // 8 éclairs au chocolat
    'dcc23560-2666-44b2-91c5-b63fd48ba153', // 4 bâtonnets vanille amandes
  ],
}

export function contenuBlack(enregistre) {
  const c = { ...BLACK_DEFAUT, ...(enregistre || {}) }
  c.produits = Array.isArray(enregistre?.produits) ? enregistre.produits : BLACK_DEFAUT.produits
  return c
}

// Une ligne du ticket : prix barré et prix remisé, calculés comme sur la carte produit (même conditionnement affiché,
// remise retrait comprise en mode Retrait). null si le produit n'est pas vendu dans ce mode.
export function ligneTicket(produit, isPickup, getPickupPrice) {
  const variante = produit.variantes?.length ? getVarianteAffichee(produit, isPickup) : null
  if (produit.variantes?.length && !variante) return null
  if (!produit.variantes?.length && (isPickup ? produit.dispo_retrait === false : produit.dispo_livraison === false)) return null
  const reference = variante ? variante.prix_livraison : produit.prix_livraison
  const enMode = (p) => (isPickup ? getPickupPrice(p) : p)
  const remise = getDiscountPercent(produit)
  return {
    produit,
    remise,
    avant: enMode(reference),
    apres: enMode(getBasePrice(produit, reference)),
  }
}
