// « Mode Black Friday » (13/11/2026, maquette 2 « Ticket de caisse » choisie par Romuald) : bannière d'accueil activable
// dans l'admin (onglet « Black Friday »). Réglages : parametres_site.black_actif (case) et parametres_site.black (contenu).
// Les prix du ticket sont les vraies promotions des fiches produits (prix promo + dates) : un produit sans promo en cours
// n'apparaît pas sur le ticket côté clients. Prioritaire sur le mode fêtes si les deux sont cochés.
import { getBasePrice, getDiscountPercent, getVarianteAffichee } from './pricing'
import { dansPeriode } from './periode'

export const BLACK_DEFAUT = {
  sur: 'Black Week · 23 → 29 novembre',
  titre1: 'Black',
  titre2: 'Friday',
  texte: 'Toute la semaine, une sélection de surgelés à prix cassés. Livrés chez vous ou à retirer au dépôt de Plouédern.',
  bouton: "J'en profite",
  lien: '/promotions',
  menu: 'Black Week',
  // Période d'affichage (case cochée + dates) : la semaine du Black Friday.
  debut: '2026-11-23',
  fin: '2026-11-29',
  // Sélection du 15/11/2026 (25 % de remise au plus, choix de Romuald ; le colis à -30 % s'ajoute en tête).
  produits: [
    '834da703-a014-455f-8037-299f911247ea', // 6 coquilles Saint-Jacques 55 %
    '13cb4802-6271-46ca-8925-e61aa463f356', // 8 paniers jambon fromage
    '38d78bbb-4ee9-41cd-be58-3dffe293f7a9', // steaks hachés 15 % 1 kg
    '87911acd-b73e-4956-b4d9-08b2be254573', // rôti fondant de dinde au beurre 550 g
    'a02e3b23-03a4-41d1-a33b-6fa4ef0b667f', // escalope de poulet
    '422a3cde-59bd-466a-9056-773e512e9dce', // paella royale
    '1a0a2cff-d494-4506-a95f-832b61b6b42e', // 12 macarons assortis
  ],
}

// Bannière Black Friday visible des clients : case cochée ET date du jour dans la période.
export const blackVisible = (settings) => {
  if (!settings?.black_actif) return false
  const c = contenuBlack(settings.black)
  return dansPeriode(c.debut, c.fin)
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
