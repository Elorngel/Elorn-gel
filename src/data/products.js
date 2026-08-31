export const categories = [
  'Entrées et apéritifs',
  'Viandes et volailles',
  'Poissons et fruits de mer',
  'Accompagnements',
  'Plats cuisinés',
  'Desserts et glaces',
  'Épicerie et boissons',
]

// Sous-catégories proposées pour chaque rayon (utilisées dans l'admin et
// dans les filtres du site). Une valeur vide ("") signifie "non classé" —
// libre à toi d'ajuster cette liste plus tard si besoin.
export const subcategoriesByCategory = {
  'Entrées et apéritifs': ['Feuilletés', 'Bouchées', 'Apéritif', 'Pizzas', 'Snacking'],
  'Viandes et volailles': [
    'Boeuf',
    'Veau',
    'Porc',
    'Agneau',
    'Charcuterie',
    'Volailles',
    'Brochettes',
  ],
  'Poissons et fruits de mer': [
    'Poissons blancs',
    'Saumon et truite',
    'Poissons panés',
    'Fruits de mer',
  ],
  Accompagnements: ['Légumes', 'Poêlées', 'Pommes de terre'],
  'Plats cuisinés': ['Plats individuels', 'Plats à partager', "Saveurs d'Asie"],
  'Desserts et glaces': [
    'Pâtisseries',
    'Viennoiseries',
    'Glaces et bâtonnets',
    'Bacs de glace',
    'Fruits',
  ],
  'Épicerie et boissons': ['Boissons', 'Épicerie sucrée', 'Épicerie salée'],
}

// Le champ "ref" est la référence article (celle de ton catalogue Excel).
// La photo est retrouvée automatiquement dans public/images/ à partir
// de cette référence : ref "0118" -> fichier images/0118.jpg
export const products = [
  {
    ref: '0118',
    name: '4 Filets de cabillaud',
    category: 'Poissons et fruits de mer',
    weight: '1 kg',
    tags: ['France', 'MSC'],
    priceLivraison: 14.9,
    pricePerKg: '14,90 €/kg',
  },
  {
    ref: '0343',
    name: 'Mini gratins dauphinois x6',
    category: 'Accompagnements',
    weight: 'Boîte 600 g',
    tags: ['France', 'Artisanal'],
    priceLivraison: 8.5,
    pricePerKg: '14,17 €/kg',
  },
  {
    ref: '3097',
    name: 'Légumes du soleil bio',
    category: 'Accompagnements',
    weight: '1 kg',
    tags: ['Bio', 'France'],
    priceLivraison: 6.2,
    pricePerKg: '6,20 €/kg',
  },
  {
    ref: '4423',
    name: 'Bûche glacée framboise',
    category: 'Desserts et glaces',
    weight: '6 parts',
    tags: ['France'],
    priceLivraison: 12.9,
    pricePerKg: '21,50 €/kg',
  },
  {
    ref: '0572',
    name: '6 Feuilletés apéritif',
    category: 'Entrées et apéritifs',
    weight: '300 g',
    tags: ['France'],
    priceLivraison: 5.4,
    pricePerKg: '18,00 €/kg',
  },
  {
    ref: '0083',
    name: '4 Pavés de saumon sans peau',
    category: 'Poissons et fruits de mer',
    weight: '480 g',
    tags: ['France', 'Sans arête'],
    priceLivraison: 17.8,
    pricePerKg: '37,08 €/kg',
  },
  {
    ref: '1702',
    name: '6 Cuisses de poulet fermier',
    category: 'Viandes et volailles',
    weight: '1,2 kg',
    tags: ['France', 'Volaille fermière'],
    priceLivraison: 13.95,
    pricePerKg: '11,63 €/kg',
  },
  {
    ref: '4441',
    name: 'Tarte abricot crème amande',
    category: 'Desserts et glaces',
    weight: '400 g',
    tags: ['France'],
    priceLivraison: 14.95,
    pricePerKg: '37,38 €/kg',
  },
]
