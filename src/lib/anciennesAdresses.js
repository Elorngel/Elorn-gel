// Anciennes adresses du site PrestaShop (bontin.fr avant la bascule) : liens gardés par
// Google, les favoris des clients ou Facebook. Le nouveau site navigue avec des « # »,
// donc on traduit ici une ancienne adresse en page équivalente :
//   /pizzas/30-pizza-chorizo.html  →  la fiche du produit le plus ressemblant
//   /54-pizzas                     →  le rayon correspondant
// (liste des anciennes adresses : sitemap PrestaShop relevé le 23/10/2026)

// Ancien rayon (sans son numéro) → [catégorie, sous-catégorie] du nouveau site.
const RAYONS = {
  poissons: ['Poissons et fruits de mer'],
  'poissons-blancs': ['Poissons et fruits de mer', 'Poissons blancs'],
  'truites-et-saumons': ['Poissons et fruits de mer', 'Saumon et truite'],
  'poissons-panes': ['Poissons et fruits de mer', 'Poissons panés'],
  'fruits-de-mer': ['Poissons et fruits de mer', 'Fruits de mer'],
  'tresors-marins': ['Poissons et fruits de mer'],
  atlantique: ['Poissons et fruits de mer'],
  viandes: ['Viandes'],
  'viandes-volailles-francaises': ['Viandes'],
  boeuf: ['Viandes', 'Boeuf'],
  veau: ['Viandes', 'Veau'],
  porc: ['Viandes', 'Porc'],
  agneau: ['Viandes', 'Agneau'],
  charcuterie: ['Viandes', 'Charcuterie'],
  volaille: ['Viandes', 'Volailles'],
  'decoupes-de-poulet': ['Viandes', 'Volailles'],
  'volailles-panees': ['Viandes', 'Volailles'],
  'volailles-entieres': ['Viandes', 'Volailles'],
  'decoupes-de-dinde': ['Viandes', 'Volailles'],
  '68-specialites': ['Viandes', 'Volailles'],
  snacking: ['Entrées et apéritifs', 'Snacking'],
  feuilletes: ['Entrées et apéritifs', 'Feuilletés'],
  bouchees: ['Entrées et apéritifs', 'Bouchées'],
  aperitif: ['Entrées et apéritifs', 'Apéritif'],
  pizzas: ['Entrées et apéritifs', 'Pizzas'],
  galettes: ['Entrées et apéritifs', 'Snacking'],
  traiteur: ['Plats cuisinés'],
  poelees: ['Plats cuisinés'],
  farcis: ['Plats cuisinés'],
  'plats-individuels': ['Plats cuisinés', 'Plats individuels'],
  'plats-a-partager': ['Plats cuisinés', 'Plats à partager'],
  'saveurs-d-asie': ['Plats cuisinés', "Saveurs d'Asie"],
  accompagnements: ['Accompagnements'],
  legumes: ['Accompagnements', 'Légumes'],
  'melanges-de-legumes': ['Accompagnements', 'Légumes'],
  'poelees-de-legumes': ['Accompagnements', 'Poêlées de légumes'],
  'pommes-de-terre': ['Accompagnements', 'Pommes de terre'],
  patisseries: ['Boulangerie', 'Pâtisseries'],
  viennoiseries: ['Boulangerie', 'Viennoiseries'],
  desserts: ['Glaces et Fruits'],
  '78-specialites': ['Glaces et Fruits'],
  'tartes-et-gateaux': ['Glaces et Fruits', 'Desserts à partager'],
  fruits: ['Glaces et Fruits', 'Fruits'],
  'cones-et-cornets': ['Glaces et Fruits', 'Cônes'],
  'coupes-glacees': ['Glaces et Fruits', 'Coupes glacées'],
  'barres-et-batonnets': ['Glaces et Fruits', 'Bâtonnets'],
  bacs: ['Glaces et Fruits', 'Bacs'],
}

// Pages fixes de PrestaShop (mots présents dans l'adresse) → page du nouveau site.
const PAGES = [
  [/mentions/, '#mentions-legales'],
  [/conditions-generales-de-vente|cgv/, '#cgv'],
  [/conditions-(generales-)?d-?utilisation|cgu/, '#cgu'],
  [/confidentialite|donnees-personnelles/, '#confidentialite'],
  [/connexion|mon-compte|identite|adresses?$|historique-commandes|order-history/, '#mon-compte'],
  [/panier|commande|cart|order/, '#panier'],
  [/promotions?|prices-drop|avantages-privilege/, '#promo'],
  [/nouveaux-produits|new-products|nouveautes|meilleures-ventes|best-sales/, '#catalogue'],
]

const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'en', 'html', 'x'])

export function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const mots = (texte) => normaliser(texte).split(' ').filter((m) => m && !MOTS_VIDES.has(m))

function hashRayon([categorie, sousCategorie]) {
  return `#categorie/${encodeURIComponent(categorie)}${sousCategorie ? `/${encodeURIComponent(sousCategorie)}` : ''}`
}

// Produit dont le nom ressemble le plus aux mots de l'ancienne adresse (au moins 70 % des mots retrouvés ;
// sinon on préfère envoyer vers le rayon que vers un mauvais produit).
function produitRessemblant(motsAdresse, produits) {
  const significatifs = motsAdresse.filter((m) => !/^\d+$/.test(m))
  if (significatifs.length === 0) return null
  let meilleur = null
  for (const p of produits) {
    if (p.actif === false) continue
    const motsProduit = new Set(mots(p.nom))
    const trouves = significatifs.filter((m) => motsProduit.has(m) || motsProduit.has(m.replace(/s$/, ''))).length
    const score = trouves / significatifs.length - motsProduit.size * 0.001 // à égalité : le nom le plus court
    // …et le nom du produit ne doit pas être bien plus long (« croissants » ≠ « croissants fourrés jambon-fromage »).
    const couvert = trouves / significatifs.length >= 0.7 && trouves / motsProduit.size >= 0.3
    if (couvert && (!meilleur || score > meilleur.score)) meilleur = { p, score }
  }
  return meilleur?.p ?? null
}

// Renvoie le « # » de la page équivalente, ou '' (accueil). `produits` : catalogue du site.
export function pageEquivalente(chemin, recherche, produits = []) {
  let morceaux
  try {
    morceaux = decodeURIComponent(chemin).toLowerCase().split('/').filter(Boolean)
  } catch {
    return ''
  }
  if (morceaux.length === 0) return ''

  // Recherche PrestaShop : /recherche?s=frites ou /index.php?controller=search&s=frites
  const motCherche = new URLSearchParams(recherche).get('s') || new URLSearchParams(recherche).get('search_query')
  if (motCherche) return `#recherche/${encodeURIComponent(motCherche)}`

  const dernier = morceaux[morceaux.length - 1].replace(/\.html?$/, '')
  const toutLeChemin = morceaux.join('/')

  // Fiche produit : /rayon/30-pizza-chorizo.html
  if (/\.html?$/.test(morceaux[morceaux.length - 1]) && /^\d+-/.test(dernier)) {
    const motsProduit = mots(dernier.replace(/^\d+-/, ''))
    const produit = produitRessemblant(motsProduit, produits)
    if (produit) return `#produit/${produit.id}`
    const rayon = RAYONS[morceaux[0]]
    if (rayon) return hashRayon(rayon)
    return `#recherche/${encodeURIComponent(motsProduit.filter((m) => !/^\d+$/.test(m)).join(' '))}`
  }

  for (const [motif, page] of PAGES) if (motif.test(toutLeChemin)) return page

  // Rayon : /54-pizzas (le numéro distingue les deux anciens rayons « specialites »)
  const rayon = RAYONS[dernier] || RAYONS[dernier.replace(/^\d+-/, '')]
  if (rayon) return hashRayon(rayon)

  return ''
}
