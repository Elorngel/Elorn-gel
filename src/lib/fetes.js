// « Mode fêtes » (13/11/2026) : page d'accueil de fin d'année, activable dans l'admin (onglet « Fêtes »).
// Réglages : parametres_site.fetes_actif (case) et parametres_site.fetes (contenu ci-dessous, modifiable).
// Tant que la case est décochée, la page d'accueil normale (Hero.jsx) s'affiche et la rubrique « Les fêtes » est cachée.
// produits : tous les produits de la rubrique « Les fêtes » (page /fetes), dans l'ordre choisi ; ceux cochés
// « couverture » (4 au plus) sont les photos de la bannière, avec leur phrase dorée et leur nom affiché.

import { dansPeriode } from './periode'
import { slug } from './adresses'

export const OR = '#d9b86a'

export const FETES_DEFAUT = {
  sur: 'Édition limitée · Fêtes 2026',
  titre: 'Le menu des fêtes',
  texte: "Une sélection de fin d'année, prête à cuire ou à déguster. Livrée chez vous ou à retirer au dépôt de Plouédern.",
  bouton: 'Composer mon menu',
  lien: '/fetes',
  // Période d'affichage (case cochée + dates) : du lendemain de la Black Week au lendemain du jour de l'an.
  debut: '2026-11-30',
  fin: '2027-01-02',
  // Jour visé par le décompte « J - 42 » (le décompte disparaît une fois la date passée).
  date_cible: '2026-12-25',
  // Sous-catégories de la rubrique « Les fêtes » (16/11/2026), dans l'ordre du menu ; renommables dans l'admin.
  sous_rayons: ['Apéritif', 'Entrées', 'Poissons et fruits de mer', 'Viandes', 'Desserts'],
  // Rubrique « Les fêtes » (16/11/2026) : sélection festive dans l'ordre d'un repas. sr = sous-catégorie,
  // couverture = une des 4 photos de la bannière. Modifiable dans l'admin (onglet Fêtes).
  produits: [
    // Apéritif
    { sr: 'Apéritif', id: '8dc3420a-c717-460f-9747-78285d83cc7f', couverture: true, phrase: 'Pour trinquer', nom: '32 canapés signature' },
    { sr: 'Apéritif', id: '7ec378e1-889a-4677-a016-aa2e757974a0' }, // pain surprise tradi coffre
    { sr: 'Apéritif', id: '3831d66e-fd9d-460c-92ca-27136368759b' }, // 16 mini feuilletés apéritif
    { sr: 'Apéritif', id: '392a11cf-1866-49d5-aaa6-0ba600318f60' }, // 12 krep'n roll de Saint-Jacques
    { sr: 'Apéritif', id: '8eb3b18b-4983-4fe1-8845-a31d678c8095' }, // 24 briochettes de Saint-Jacques
    // Entrées
    { sr: 'Entrées', id: '834da703-a014-455f-8037-299f911247ea' }, // 6 coquilles Saint-Jacques 55 % de noix
    { sr: 'Entrées', id: 'c66af15d-1c86-4f43-89fc-282aa435a4a5' }, // cassolette Saint-Jacques à la bretonne
    { sr: 'Entrées', id: 'a523d1b9-9e25-4e04-b71a-a76a5c4d2278' }, // cassolette Saint-Jacques sauce champagne
    { sr: 'Entrées', id: 'ce891ba6-119e-4c2c-bced-cc9dcd97e627' }, // 4 feuilletés Saint-Jacques
    { sr: 'Entrées', id: 'e7012fe6-9689-4be5-9d18-5f07a27a5e92' }, // 4 bouchées ris de veau
    { sr: 'Entrées', id: '6397413d-8291-4253-b17a-077508d91ca7' }, // 48 escargots de Bourgogne
    { sr: 'Entrées', id: '56fabb74-b691-4732-b69d-578d3b232e64' }, // 24 pétoncles farcies
    { sr: 'Entrées', id: '5a13ebf5-ef2d-427b-a44e-2eba2982888d' }, // 24 palourdes farcies
    { sr: 'Entrées', id: '7b1ce81b-c19a-40ea-9f22-65bbedd23a3a' }, // 4 médaillons de saumon farci
    // Poissons et fruits de mer
    { sr: 'Poissons et fruits de mer', id: 'b24e1d49-f418-4dea-b8c9-956b3ee15bcb', couverture: true, phrase: 'Une entrée qui brille', nom: 'Noix de Saint-Jacques' },
    { sr: 'Poissons et fruits de mer', id: 'd3a93761-b249-479f-b81d-65faa31f06aa' }, // noix de Saint-Jacques 800 g
    { sr: 'Poissons et fruits de mer', id: '9142a789-d57e-426e-88c5-123c7407322d' }, // saumon fumé de Norvège
    { sr: 'Poissons et fruits de mer', id: 'fcbff3bf-7e97-42ca-9cb9-261187e33aff' }, // truite fumée de Bretagne
    { sr: 'Poissons et fruits de mer', id: '69e87724-b0bf-4e23-8064-6c30243ced14' }, // crevettes sauvages cuites
    { sr: 'Poissons et fruits de mer', id: '1f39d743-91e0-4dd3-be2f-cb8a801a3288' }, // gambas sauvages crues
    { sr: 'Poissons et fruits de mer', id: '981c1048-f5da-48bc-83dc-2d0daca64b1b' }, // langoustines crues entières
    { sr: 'Poissons et fruits de mer', id: '0e17ec03-8801-4fc3-b6bf-cd0427558a28' }, // pinces de tourteaux cuites
    // Viandes
    { sr: 'Viandes', id: '91640918-af8b-48e1-b8fe-27006618e5b5', couverture: true, phrase: 'Le plat du réveillon', nom: 'Rôti de 2 magrets de canard' },
    { sr: 'Viandes', id: '0d00f55a-b31a-435e-925c-34e83049025d' }, // chapon fermier Label Rouge
    { sr: 'Viandes', id: '127f6e77-03a8-4ec0-9037-51e08f0389ed' }, // épaule de porcelet farcie
    { sr: 'Viandes', id: '8279a8ed-5a2a-46ac-aeeb-5a5d84391165' }, // pintade farcie aux cèpes
    { sr: 'Viandes', id: '8b23152e-892f-4a20-8d42-053a4c50200e' }, // cailles crapaudine sauce au foie gras
    { sr: 'Viandes', id: '349d3038-64cb-4cc5-bb2c-3a8cdfa88dda' }, // rôti de dinde farci marrons-cèpes
    { sr: 'Viandes', id: 'd4e30496-7945-499b-8359-b702b0d63320' }, // 4 souris d'agneau
    // Desserts
    { sr: 'Desserts', id: '1a0a2cff-d494-4506-a95f-832b61b6b42e', couverture: true, phrase: 'Pour finir en douceur', nom: 'Macarons assortis' },
    { sr: 'Desserts', id: '836e50ee-8898-40c3-af68-fbad6157ea99' }, // 12 petits fours
    { sr: 'Desserts', id: '7b4e5a0c-2d0f-4587-9be8-1c0817b2dac3' }, // bûche profiteroles
    { sr: 'Desserts', id: '8cca28d5-45bd-4292-851b-700f45acebab' }, // bûche façon rocher
    { sr: 'Desserts', id: '9c3e2e04-35bf-46dc-b0b1-a91a34489347' }, // bûche Framboisissima
    { sr: 'Desserts', id: '47cbc562-fbd3-4328-a19b-f4b5dfb7b61e' }, // bûche choco tonka
    { sr: 'Desserts', id: 'ecd0f35c-5abd-4386-a8df-449080bd7743' }, // bûche Breizh
    { sr: 'Desserts', id: 'd377938f-4e1c-43bf-a950-547a751fffff' }, // bûche citron meringuée
    { sr: 'Desserts', id: '3efb84a9-1f42-4435-b01e-caed94b6761b' }, // bûche pâtissière au café
    { sr: 'Desserts', id: '10a4662d-128b-488a-9311-8e6a86d05ac8' }, // bûche caramel pomme cidrée Madenn
    { sr: 'Desserts', id: '3f6ded01-1b25-4568-8ccf-21e9b46c3011' }, // 6 bûchettes individuelles
    { sr: 'Desserts', id: 'a9c3d836-fa14-4930-8e73-82e3efbcf741' }, // croustillant 3 chocolats
  ],
  dates_titre: 'Les dates à retenir',
  dates: [
    { date: '2026-12-15', titre: 'Commandez tôt', texte: 'Les créneaux de la semaine de Noël sont les plus demandés.' },
    { date: '2026-12-23', titre: 'Dernières livraisons', texte: 'Pour Noël, partout dans notre zone.' },
    { date: '2026-12-24', titre: 'Dernier retrait', texte: "Au dépôt jusqu'à midi." },
    { date: '2026-12-31', titre: 'Réveillon', texte: "Retrait au dépôt jusqu'à midi." },
  ],
}

// Contenu enregistré complété par les valeurs par défaut (champs jamais enregistrés = texte de départ).
export function contenuFetes(enregistre) {
  const c = { ...FETES_DEFAUT, ...(enregistre || {}) }
  c.produits = Array.isArray(enregistre?.produits) ? enregistre.produits : FETES_DEFAUT.produits
  c.dates = Array.isArray(enregistre?.dates) ? enregistre.dates : FETES_DEFAUT.dates
  c.sous_rayons = Array.isArray(enregistre?.sous_rayons) ? enregistre.sous_rayons : FETES_DEFAUT.sous_rayons
  return c
}

// Bannière et rubrique « Les fêtes » visibles des clients : case cochée ET date du jour dans la période.
export const fetesVisible = (settings) => {
  if (!settings?.fetes_actif) return false
  const c = contenuFetes(settings.fetes)
  return dansPeriode(c.debut, c.fin)
}

// Adresse d'une sous-catégorie : /fetes/aperitif (sans sous-catégorie : /fetes).
export const urlFetes = (sousRayon) => (sousRayon ? `/fetes/${slug(sousRayon)}` : '/fetes')
// Sous-catégories qui ont au moins un produit (pour le menu et les boutons de la page), dans l'ordre réglé.
export const sousRayonsUtilises = (c) => c.sous_rayons.filter((sr) => c.produits.some((p) => p.sr === sr))
// « aperitif » (adresse) → « Apéritif » ; null si inconnue.
export const sousRayonDepuisAdresse = (c, morceau) => c.sous_rayons.find((sr) => slug(sr) === morceau) || null

export const MAX_COUVERTURE = 4
// Produits montrés en photo dans la bannière (cochés « couverture », 4 au plus, dans l'ordre de la liste).
export const produitsCouverture = (c) => c.produits.filter((p) => p.couverture).slice(0, MAX_COUVERTURE)

// Nombre de jours jusqu'à la date visée (heure de Paris) ; 0 ou moins = date passée.
export function joursAvant(dateCible, aujourdhui) {
  const m = String(dateCible || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const a = String(aujourdhui || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m || !a) return 0
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(+a[1], +a[2] - 1, +a[3])) / 86400000)
}

// « 2026-12-23 » → { jour: 'mercredi', num: 23, mois: 'décembre' }
export function morceauxDate(cle) {
  const d = new Date(`${cle}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
    num: d.getDate(),
    mois: d.toLocaleDateString('fr-FR', { month: 'long' }),
  }
}
