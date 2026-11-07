import { estDansRayon } from './rayons.js'

// Filtres de la liste des produits dans l'admin (07/11/2026).
// Dans un même groupe, les filtres s'additionnent (« Masqués » OU « Publiés ») ; d'un groupe à l'autre, ils se
// combinent (« Masqués » ET « En rupture »). Le choix est retenu sur l'appareil.
const vide = (texte) => !String(texte || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

export const GROUPES_FILTRES = [
  {
    titre: 'Sur le site',
    filtres: [
      { id: 'publies', libelle: 'Publiés', test: (p) => p.actif !== false },
      { id: 'masques', libelle: 'Masqués', test: (p) => p.actif === false },
    ],
  },
  {
    titre: 'Stock',
    filtres: [
      { id: 'en_stock', libelle: 'En stock', test: (p) => !p.en_rupture },
      { id: 'rupture', libelle: 'En rupture', test: (p) => !!p.en_rupture },
    ],
  },
  {
    titre: 'Offres',
    filtres: [
      { id: 'promo', libelle: 'En promo', test: (p) => !!p.en_promo },
      { id: 'destockage', libelle: 'Déstockage', test: (p) => !!p.en_destockage },
    ],
  },
  {
    titre: 'Vente',
    filtres: [
      { id: 'pas_livraison', libelle: 'Pas en livraison', test: (p) => p.dispo_livraison === false },
      { id: 'pas_retrait', libelle: 'Pas en retrait', test: (p) => p.dispo_retrait === false },
      { id: 'alcool', libelle: 'Alcool', test: (p) => !!p.alcool },
    ],
  },
  {
    titre: 'À compléter',
    filtres: [
      { id: 'sans_photo', libelle: 'Sans photo', test: (p) => !p.photo_url },
      { id: 'sans_ingredients', libelle: 'Sans ingrédients', test: (p) => vide(p.ingredients) },
      { id: 'sans_description', libelle: 'Sans description', test: (p) => vide(p.description) },
      { id: 'sans_prix', libelle: 'Sans prix', test: (p) => !(Number(p.prix_livraison) > 0) },
    ],
  },
]

export const FILTRES_VIDES = { actifs: [], categorie: '', fournisseur: '' }

export function filtrerProduits(produits, { actifs = [], categorie = '', fournisseur = '' }) {
  const groupes = GROUPES_FILTRES.map((g) => g.filtres.filter((f) => actifs.includes(f.id))).filter((g) => g.length)
  return produits.filter(
    (p) =>
      groupes.every((g) => g.some((f) => f.test(p))) &&
      (!categorie || estDansRayon(p, categorie)) &&
      (!fournisseur || (fournisseur === '__aucun__' ? !String(p.fournisseur || '').trim() : p.fournisseur === fournisseur))
  )
}
