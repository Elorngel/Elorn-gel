// Kit Facebook / Instagram des fêtes (décembre 2026) — la liste des publications, source unique.
// Sert à fabriquer les visuels, le guide HTML et le programme texte : `node docs/fetes-decembre/source/generer.mjs`.
// Règles de Romuald (20/11/2026) : 3 à 4 publications par semaine jusqu'au 24/12, un message le 31/12 et le 01/01,
// charte des fêtes (vert forêt, or, carte à coins coupés), produits du rayon « Fêtes », surtout les bûches,
// JAMAIS le même produit deux fois dans le mois. Fermeture du 25/12 au 03/01, réouverture le lundi 04/01/2027.
// Prix relevés sur le site le 20/11/2026 (prix en livraison ; remise retrait à 0 %, donc identiques en retrait).

// {LIEN} : sur Instagram, « lien dans la bio ». Sur Facebook, RIEN (Romuald, 20/11/2026 : un lien fait apparaître un
// aperçu qu'il faut retirer à chaque fois) — le nom du site est déjà, discrètement, sur chaque image.
export const LIEN_IG = '👉 Lien dans la bio (bontin.fr)'
const TAGS_BASE = '#Bontin #Plouédern #Landerneau #Finistère #Bretagne #commercelocal'

// Produits mis en avant (id = 8 premiers caractères de l'id Supabase). Chacun n'apparaît qu'une seule fois.
export const PRODUITS = {
  profiteroles: { id: '7b4e5a0c', nom: 'BÛCHE PROFITEROLES-10/12 PARTS' },
  breizh: { id: 'ecd0f35c', nom: 'BÛCHE BREIZH- 8 PARTS' },
  rocher: { id: '8cca28d5', nom: 'BÛCHE FAÇON ROCHER- 8 PARTS' },
  framb: { id: '9c3e2e04', nom: 'BÛCHE FRAMBISSIMA- 8 PARTS' },
  citron: { id: 'd377938f', nom: 'BÛCHE CITRON MERINGUE 8 PARTS' },
  pomme: { id: '10a4662d', nom: 'BÛCHE CARAMEL / POMME CIDREE - 6-8 PARTS' },
  cafe: { id: '3efb84a9', nom: 'BÛCHE PÂTISSIÈRE AU CAFÉ-6-8 PARTS' },
  feuilletesApero: { id: '3831d66e', nom: '16 MINI FEUILLETES APERITIF' },
  cassolette: { id: 'a523d1b9', nom: 'CASSOLETTE ST JACQUES SAUCE CHAMPAGNE' },
  pintade: { id: '8279a8ed', nom: 'PINTADE FARCIE AUX CEPES' },
  langoustines: { id: '981c1048', nom: 'LANGOUSTINES CRUES ENTIERES' },
  gambas: { id: '1f39d743', nom: 'GAMBAS SAUVAGES CRUES' },
  quiches: { id: 'a51290b8', nom: '25 MINI QUICHES APERITIVES' },
  feuilletes: { id: 'ce891ba6', nom: '4 FEUILLETÉS ST JACQUES' },
  dinde: { id: '349d3038', nom: 'ROTI DE DINDE FARCI MARRONS CEPES' },
  macarons: { id: '1a0a2cff', nom: '12 MACARONS ASSORTIS' },
  petitsfours: { id: '836e50ee', nom: '12 PETITS FOURS DESSERT' },
}

// Visuels. type : dates | produit | interieur | duo | menu | voeux | couverture. format : post (1080×1350),
// story (1080×1920), couv (1640×624).
export const VISUELS = {
  '01-buche-profiteroles': {
    mise: 'plein', fond: 'bleu', hauteur: 900, type: 'produit', format: 'post', produit: 'profiteroles', pos: '50% 30%',
    chip: 'Les bûches de Noël', sur: 'Notre plus grande bûche', titre: 'Bûche profiteroles',
    phrase: '12 choux à la vanille Bourbon, glace praliné, chocolat noir et noisettes croquantes.',
    prix: '32,90 €', infos: 'Glacée<br>10 à 12 parts',
  },
  '01b-buche-profiteroles-interieur': { fond: 'bleu', type: 'interieur', format: 'post', produit: 'profiteroles', zoom: 108, titre: 'La bûche profiteroles' },

  '02-gambas': {
    mise: 'haut', type: 'produit', format: 'post', produit: 'gambas', pos: '50% 50%',
    chip: 'Les produits de la mer', sur: 'Pour la plancha des fêtes', titre: 'Gambas sauvages',
    phrase: 'De belles gambas sauvages d’Argentine, crues, à saisir à la poêle ou à la plancha.',
    prix: '18,49 €', infos: '1 kg<br>10 à 20 pièces',
  },

  '01-story-dates': {
    type: 'dates', format: 'story',
    sur: 'Décembre chez Bontin', titre: 'Les dates à retenir',
    lignes: [
      { j: 'Dès', n: '✦', m: 'maintenant', t: 'Commandez tôt', x: 'Les créneaux de la semaine de Noël partent vite.' },
      { j: 'Mercredi', n: '23', m: 'déc.', t: 'Dernières livraisons', x: 'Commande la veille au plus tard.' },
      { j: 'Jeudi', n: '24', m: 'déc.', t: 'Dernier retrait', x: "Au dépôt de Plouédern jusqu'à midi." },
      { j: 'Lundi', n: '04', m: 'janv.', t: 'Réouverture', x: 'Fermé du 25 décembre au 3 janvier.' },
    ],
  },

  '03-buche-breizh': {
    fond: 'bleu',
    type: 'produit', format: 'post', produit: 'breizh', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'La bûche de chez nous', titre: 'Bûche Breizh',
    phrase: 'Palet breton, caramel au beurre salé et éclats de caramel.',
    prix: '26,90 €', infos: 'Glacée<br>8 parts',
  },
  '03b-buche-breizh-interieur': { fond: 'bleu', type: 'interieur', format: 'post', produit: 'breizh', titre: 'La bûche Breizh' },

  '04-mini-feuilletes': {
    mise: 'plein', type: 'produit', format: 'post', produit: 'feuilletesApero', pos: '50% 55%',
    chip: "L'apéritif", sur: 'Pour trinquer', titre: '16 mini feuilletés apéritif',
    phrase: 'Pâte feuilletée pur beurre : emmental, tomate, truite et jambon-emmental.',
    prix: '8,99 €', infos: 'Les 16<br>15 min au four',
  },

  '05-buche-rocher': {
    fond: 'bleu',
    mise: 'arche', type: 'produit', format: 'post', produit: 'rocher', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Pour les fans de praliné', titre: 'Bûche façon Rocher',
    phrase: 'Praliné, vanille, cœur caramel au lait, coque chocolat au lait et riz soufflé.',
    prix: '26,90 €', infos: 'Glacée<br>8 parts',
  },
  '05b-buche-rocher-interieur': { fond: 'bleu', type: 'interieur', format: 'post', produit: 'rocher', titre: 'La bûche façon Rocher' },

  '06-cassolettes': {
    mise: 'haut', type: 'produit', format: 'post', produit: 'cassolette', pos: '50% 55%',
    chip: "L'entrée", sur: "L'entrée chic sans effort", titre: 'Cassolettes de Saint-Jacques',
    phrase: 'Sauce au champagne, servies dans leur cassolette en céramique.',
    prix: '13,99 €', infos: '4 cassolettes<br>20 min au four',
  },

  '07-buche-frambissima': {
    fond: 'bleu',
    type: 'produit', format: 'post', produit: 'framb', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Fruitée et légère', titre: 'Bûche Frambissima',
    phrase: 'Framboise, vanille Bourbon de Madagascar, coulis de framboise et meringue.',
    prix: '26,90 €', infos: 'Glacée<br>6 à 8 parts',
  },
  '07b-buche-frambissima-interieur': { fond: 'bleu', type: 'interieur', format: 'post', produit: 'framb', titre: 'La bûche Frambissima' },

  '08-pintade': {
    mise: 'plein', type: 'produit', format: 'post', produit: 'pintade', pos: '50% 55%',
    chip: 'Le plat', sur: 'Le plat du réveillon', titre: 'Pintade farcie aux cèpes',
    phrase: 'Pintade française semi-désossée, farce aux cèpes et touche de vieil Armagnac.',
    prix: '24,99 €', infos: '1,2 kg<br>1 h 30 au four',
  },

  '09-langoustines': {
    mise: 'haut', type: 'produit', format: 'post', produit: 'langoustines', pos: '50% 50%',
    chip: 'Les produits de la mer', sur: "Un produit d'exception", titre: 'Langoustines entières',
    phrase: 'Pêchées en pleine mer, une chair fine et délicatement sucrée.',
    prix: '18,59 €', infos: '1 kg<br>20 à 30 pièces',
  },

  '10-menu-reveillon': {
    type: 'menu', format: 'post',
    sur: 'Idée menu de réveillon', titre: 'Pour 4, à moins de 50 €',
    plats: [
      { produit: 'quiches', role: "L'apéritif", nom: '25 mini quiches', prix: '13,90 €' },
      { produit: 'feuilletes', role: "L'entrée", nom: '4 feuilletés Saint-Jacques', prix: '8,89 €' },
      { produit: 'dinde', role: 'Le plat', nom: 'Rôti de dinde marrons-cèpes', prix: '14,99 €' },
      { produit: 'macarons', role: 'Le dessert', nom: '12 macarons assortis', prix: '10,45 €' },
    ],
    total: '48,23 €',
  },

  '11-buche-citron': {
    fond: 'bleu',
    mise: 'arche', type: 'produit', format: 'post', produit: 'citron', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Comme une tarte au citron', titre: 'Bûche citron meringuée',
    phrase: 'Citron de Sicile, sorbet citron vert, pâte sucrée et meringue italienne.',
    prix: '26,90 €', infos: 'Glacée<br>8 parts',
  },
  '11b-buche-citron-interieur': { fond: 'bleu', type: 'interieur', format: 'post', produit: 'citron', titre: 'La bûche citron meringuée' },

  '12-j-6': {
    type: 'dates', format: 'post',
    sur: 'Dernière ligne droite', titre: 'Noël, c’est dans', compte: '6',
    lignes: [
      { j: 'Mercredi', n: '23', m: 'déc.', t: 'Dernières livraisons', x: 'Commande au plus tard le mardi 22.' },
      { j: 'Jeudi', n: '24', m: 'déc.', t: 'Dernier retrait', x: "Au dépôt jusqu'à midi, commande au plus tard le mercredi 23." },
    ],
  },
  '12-story-j-6': { base: '12-j-6', format: 'story' },

  '13-buches-11-90': {
    type: 'duo', format: 'post',
    tuiles: [
      { produit: 'pomme', role: 'Glacée', nom: 'Caramel & pomme cidrée', prix: '11,90 €', pos: '50% 55%' },
      { produit: 'cafe', role: 'Pâtissière', nom: 'Bûche au café', prix: '11,90 €', pos: '50% 55%' },
    ],
    sur: 'Petit prix, grand dessert', titre: 'Deux bûches à 11,90 €',
    phrase: 'Pomme et caramel au beurre salé, ou génoise et crème au beurre au café.',
    bas: '<span class="bandeau">6 à 8 parts chacune · glacée ou pâtissière</span>',
  },

  '14-dernier-jour-livraison': {
    mise: 'plein', type: 'produit', format: 'post', produit: 'petitsfours', pos: '50% 55%',
    chip: 'Aujourd’hui : dernier jour en livraison', sur: 'Pour finir le repas en douceur', titre: '12 petits fours dessert',
    phrase: 'Opéra café-chocolat, mini-éclairs, tartelettes au citron et financiers à la framboise.',
    prix: '10,39 €', infos: 'Les 12<br>5 h au frigo',
  },

  '15-dernier-jour-commande': {
    type: 'dates', format: 'post',
    sur: 'Dernier jour pour commander', titre: 'Retrait demain jusqu’à midi',
    lignes: [
      { j: 'Aujourd’hui', n: '23', m: 'déc.', t: 'Commandez sur bontin.fr', x: 'Les livraisons du jour sont en route.' },
      { j: 'Demain', n: '24', m: 'déc.', t: 'Retrait au dépôt', x: "À Plouédern, de 8 h à midi." },
    ],
  },
  '15-story-dernier-jour': { base: '15-dernier-jour-commande', format: 'story' },

  '16-joyeux-noel': {
    type: 'voeux', format: 'post',
    sur: 'Toute l’équipe Bontin vous souhaite un', titre: 'Joyeux<br><span>Noël</span>',
    texte: 'Merci pour votre confiance cette année.<br>Belles fêtes en famille !',
    info: 'Fermé du 25 décembre au 3 janvier<br><b>Réouverture le lundi 4 janvier</b>',
  },
  '16-story-joyeux-noel': { base: '16-joyeux-noel', format: 'story' },
  '16-couverture-fermeture': {
    type: 'couverture', format: 'couv',
    sur: 'Fermé du 25 décembre au 3 janvier', titre: 'On se retrouve le 4 janvier',
    texte: 'Joyeuses fêtes ! Le site reste ouvert : commandez dès maintenant sur bontin.fr',
  },

  '17-bon-reveillon': {
    mise: 'nuit', type: 'voeux', format: 'post',
    sur: 'Pour la dernière soirée de 2026', titre: 'Bon<br><span>réveillon</span>',
    texte: 'Plein de bons moments, de rires<br>et de bonnes choses à partager.',
    info: 'On se retrouve le lundi 4 janvier',
  },
  '17-story-bon-reveillon': { base: '17-bon-reveillon', format: 'story' },

  '18-bonne-annee': {
    type: 'voeux', format: 'post', annee: '2027',
    sur: 'Toute l’équipe Bontin vous souhaite une', titre: 'Bonne année',
    texte: 'Pleine de santé et de bons repas partagés.',
    info: 'Le dépôt rouvre ce <b>lundi 4 janvier</b>',
  },
  '18-story-bonne-annee': { base: '18-bonne-annee', format: 'story' },
}

// Le calendrier. semaine : sert aux titres du guide. visuels : clés de VISUELS (le 1er = la publication ;
// « carrousel » = toutes les images dans la même publication). story / couverture : à faire le même jour.
export const PUBLICATIONS = [
  {
    date: '2026-12-01', heure: '18 h 30', titre: 'Bûche profiteroles + dates à retenir', visuels: ['01-buche-profiteroles', '01b-buche-profiteroles-interieur'], carrousel: true, story: '01-story-dates',
    produits: ['profiteroles'], tags: '#bûchedeNoël #bûcheglacée #profiteroles #Noël #menudefêtes',
    texte: `🎄 Décembre est là, et pour ouvrir le bal : notre plus belle bûche !

La bûche profiteroles : 12 petits choux garnis de crème glacée à la vanille Bourbon de Madagascar, sur une base glacée au praliné enrobée de chocolat noir et de noisettes croquantes, avec une mousse vanillée et une ganache au chocolat. Glissez pour voir l'intérieur 👉

10 à 12 parts · 32,90 €
Une bûche glacée : commandez-la dès maintenant, elle attend au congélateur jusqu'au jour J.

📅 Les dates à retenir :
• Mercredi 23 décembre : dernières livraisons avant Noël
• Jeudi 24 décembre : dernier retrait au dépôt de Plouédern, jusqu'à midi
• Commande au plus tard la veille
• Du 25 décembre au 3 janvier : on ferme pour les fêtes, réouverture le lundi 4 janvier

Tout le menu des fêtes est dans la rubrique « Les fêtes » du site.

{LIEN}`,
  },
  {
    date: '2026-12-02', heure: '12 h', titre: 'Gambas sauvages', visuels: ['02-gambas'],
    produits: ['gambas'], tags: '#gambas #produitsdelamer #plancha #Noël',
    texte: `🦐 Des gambas pour les fêtes ?

Nos gambas sauvages d'Argentine sont de belles pièces : 10 à 20 au kilo. Crues, elles se décongèlent au réfrigérateur puis se saisissent en quelques minutes à la poêle ou à la plancha, avec un filet d'huile d'olive, de l'ail et du persil… Effet garanti à l'apéritif comme en entrée !

1 kg · 18,49 € (ou 500 g à 9,24 € en retrait au dépôt)

{LIEN}`,
  },
  {
    date: '2026-12-03', heure: '12 h', titre: 'Bûche Breizh', visuels: ['03-buche-breizh', '03b-buche-breizh-interieur'], carrousel: true,
    produits: ['breizh'], tags: '#bûchedeNoël #bûcheglacée #caramelbeurresalé #Noël',
    texte: `🧈 La bûche de chez nous : la bûche Breizh !

Crème glacée au palet breton, cœur de crème glacée au caramel au beurre salé, éclats de caramel et coulis caramel au beurre salé. Glissez pour voir l'intérieur 👉

8 parts · 26,90 €
Une bûche glacée : elle attend tranquillement au congélateur jusqu'au jour J.

Vous êtes plutôt Breizh ou chocolat ? Dites-le-nous en commentaire 👇

{LIEN}`,
  },
  {
    date: '2026-12-05', heure: '11 h 30', titre: '16 mini feuilletés apéritif', visuels: ['04-mini-feuilletes'],
    produits: ['feuilletesApero'], tags: '#apéritif #apérodefêtes #Noël #réveillon',
    texte: `🥂 L'apéritif des fêtes, prêt en 15 minutes.

16 mini feuilletés en pâte feuilletée pur beurre, en quatre saveurs : emmental, tomate, truite et jambon-emmental. Direction le four, sans décongélation, et c'est l'heure de trinquer !

8,99 € les 16

{LIEN}`,
  },
  {
    date: '2026-12-07', heure: '18 h 30', titre: 'Bûche façon Rocher', visuels: ['05-buche-rocher', '05b-buche-rocher-interieur'], carrousel: true,
    produits: ['rocher'], tags: '#bûchedeNoël #bûcheglacée #praliné #Noël',
    texte: `🍫 Les fans de praliné, celle-ci est pour vous.

La bûche façon Rocher : crème glacée praliné et vanille, cœur de caramel au lait, meringue, le tout dans une coque au chocolat au lait et riz soufflé croustillant.

8 parts · 26,90 €
Glissez pour voir ce qu'il y a dedans 👉

{LIEN}`,
  },
  {
    date: '2026-12-09', heure: '12 h', titre: 'Cassolettes de Saint-Jacques', visuels: ['06-cassolettes'],
    produits: ['cassolette'], tags: '#SaintJacques #entréedefêtes #Noël #réveillon',
    texte: `✨ Une entrée chic, prête en 20 minutes.

Nos cassolettes de Saint-Jacques à la sauce au champagne, servies dans leur cassolette en céramique : direction le four, sans décongélation, et c'est servi.

4 cassolettes · 13,99 €

{LIEN}`,
  },
  {
    date: '2026-12-11', heure: '18 h 30', titre: 'Bûche Frambissima', visuels: ['07-buche-frambissima', '07b-buche-frambissima-interieur'], carrousel: true,
    produits: ['framb'], tags: '#bûchedeNoël #bûcheglacée #framboise #Noël',
    texte: `🍓 Envie de fraîcheur après un bon repas ?

La bûche Frambissima : crème glacée à la framboise, glace à la vanille Bourbon de Madagascar, cœur de coulis de framboise et meringue. Fruitée, légère, et toujours aussi gourmande.

6 à 8 parts · 26,90 €
Glissez pour voir l'intérieur 👉

{LIEN}`,
  },
  {
    date: '2026-12-13', heure: '11 h', titre: 'Pintade farcie aux cèpes', visuels: ['08-pintade'],
    produits: ['pintade'], tags: '#pintade #platdefêtes #Noël #réveillon',
    texte: `🍽 Le plat du réveillon qui fait son effet sur la table.

Une pintade française semi-désossée, généreusement farcie aux cèpes et aux champignons, avec une délicate touche de vieil Armagnac. Elle va au four sans décongélation : 1 h 30 à 180 °C, et c'est prêt.

1,2 kg · 24,99 €
Avec des marrons ou un gratin, le tour est joué 😋

{LIEN}`,
  },
  {
    date: '2026-12-14', heure: '18 h 30', titre: 'Langoustines entières', visuels: ['09-langoustines'],
    produits: ['langoustines'], tags: '#langoustines #produitsdelamer #Noël #réveillon',
    texte: `🦐 Des langoustines pour les fêtes ?

Pêchées en pleine mer, nos langoustines entières ont une chair fine et délicatement sucrée. Un produit d'exception à savourer tout simplement poêlé, pour l'entrée ou le plateau du réveillon.

1 kg (20 à 30 pièces) · 18,59 €

{LIEN}`,
  },
  {
    date: '2026-12-16', heure: '12 h', titre: 'Un réveillon pour 4 à moins de 50 €', visuels: ['10-menu-reveillon'],
    produits: ['quiches', 'feuilletes', 'dinde', 'macarons'], tags: '#menudefêtes #réveillon #Noël #bonplan',
    texte: `🍽 Un réveillon complet pour 4, à moins de 50 € ?

Voici notre idée de menu :
🥂 Apéritif : 25 mini quiches apéritives (13,90 €)
🐚 Entrée : 4 feuilletés de Saint-Jacques (8,89 €)
🦃 Plat : rôti de dinde farci aux marrons et aux cèpes (14,99 €)
🍬 Dessert : 12 macarons assortis (10,45 €)

Total : 48,23 € pour tout le repas.
Tout se garde au congélateur jusqu'au jour J. Pensez juste à sortir le rôti la veille et les macarons 4 heures avant, au réfrigérateur.

{LIEN}`,
  },
  {
    date: '2026-12-18', heure: '18 h 30', titre: 'Bûche citron meringuée', visuels: ['11-buche-citron', '11b-buche-citron-interieur'], carrousel: true,
    produits: ['citron'], tags: '#bûchedeNoël #bûcheglacée #citron #Noël',
    texte: `🍋 Comme une tarte au citron… mais en bûche glacée !

Crème glacée au citron de Sicile, sorbet au citron vert, pâte sucrée et une belle meringue italienne. La bûche idéale pour finir un repas copieux sur une note fraîche.

8 parts · 26,90 €
Glissez pour voir l'intérieur 👉

{LIEN}`,
  },
  {
    date: '2026-12-19', heure: '11 h', titre: 'Noël dans 6 jours', visuels: ['12-j-6'], story: '12-story-j-6',
    tags: '#Noël #menudefêtes',
    texte: `⏳ Noël, c'est dans 6 jours !

Pour être tranquille, pensez à commander :
🚚 Livraison : dernières livraisons le mercredi 23 décembre (commande au plus tard le mardi 22)
🏠 Retrait au dépôt de Plouédern : jusqu'au jeudi 24 décembre à midi (commande au plus tard le mercredi 23)

Les créneaux de la semaine de Noël partent vite 😉

{LIEN}`,
  },
  {
    date: '2026-12-21', heure: '12 h', titre: 'Deux bûches à 11,90 €', visuels: ['13-buches-11-90'],
    produits: ['pomme', 'cafe'], tags: '#bûchedeNoël #petitprix #Noël',
    texte: `🎄 Une belle bûche pour 11,90 € ? On en a deux !

🍏 La bûche caramel et pomme cidrée : une bûche glacée pomme et caramel au beurre salé, avec des éclats croquants et un décor au chocolat.
☕ La bûche pâtissière au café : génoise moelleuse, crème au beurre au café et décor chocolat, comme chez le pâtissier.

6 à 8 parts chacune · 11,90 €
(la bûche au café se décongèle environ 6 heures au réfrigérateur)

{LIEN}`,
  },
  {
    date: '2026-12-22', heure: '11 h 30', titre: 'Dernier jour pour commander en livraison', visuels: ['14-dernier-jour-livraison'],
    produits: ['petitsfours'], tags: '#Noël #dernièreminute #petitsfours',
    texte: `🚚 Aujourd'hui, dernier jour pour commander en livraison !

Les commandes passées aujourd'hui sont livrées demain, mercredi 23 décembre, juste à temps pour Noël.

Et pour finir le repas en douceur, avec le café : nos 12 petits fours dessert 🍰
Opéra café-chocolat, mini-éclairs au chocolat, tartelettes au citron et financiers à la framboise.
10,39 € les 12 · à sortir 5 heures avant, au réfrigérateur

Après aujourd'hui, il reste le retrait au dépôt de Plouédern jusqu'au jeudi 24 à midi.

{LIEN}`,
  },
  {
    date: '2026-12-23', heure: '12 h', titre: 'Dernier jour pour commander', visuels: ['15-dernier-jour-commande'], story: '15-story-dernier-jour',
    tags: '#Noël #dernièreminute',
    texte: `⏰ Dernier jour pour commander avant Noël !

Commandez aujourd'hui et retirez votre commande demain, jeudi 24 décembre, au dépôt de Plouédern, de 8 h à midi.

Merci à tous ceux qui ont déjà commandé : les livraisons sont en route aujourd'hui 🚚🎄

{LIEN}`,
  },
  {
    date: '2026-12-24', heure: '14 h', titre: 'Joyeux Noël + fermeture', visuels: ['16-joyeux-noel'], story: '16-story-joyeux-noel', couverture: '16-couverture-fermeture',
    tags: '#JoyeuxNoël #Noël',
    texte: `🎄 Joyeux Noël à tous !

Toute l'équipe Bontin vous remercie pour votre confiance cette année. Belles fêtes en famille, et bonne dégustation 😋

Le dépôt est fermé du vendredi 25 décembre au dimanche 3 janvier. On se retrouve le lundi 4 janvier !
Le site reste ouvert : vous pouvez déjà commander pour une livraison ou un retrait à partir du 4 janvier.

{LIEN}`,
  },
  {
    date: '2026-12-31', heure: '17 h', titre: 'Bon réveillon', visuels: ['17-bon-reveillon'], story: '17-story-bon-reveillon',
    tags: '#bonréveillon #nouvelan #réveillon',
    texte: `✨ Bon réveillon à tous !

Que cette dernière soirée de 2026 soit pleine de bons moments, de rires et de bonnes choses à partager.

Merci d'avoir fait de cette année une belle année pour Bontin 🙏
On se retrouve le lundi 4 janvier.`,
  },
  {
    date: '2027-01-01', heure: '10 h', titre: 'Bonne année 2027', visuels: ['18-bonne-annee'], story: '18-story-bonne-annee',
    tags: '#bonneannée #bonneannée2027 #nouvelan',
    texte: `🥂 Bonne année 2027 !

Toute l'équipe Bontin vous souhaite une belle et heureuse année, pleine de santé et de bons repas partagés.

Le dépôt rouvre ce lundi 4 janvier : livraisons et retraits reprennent dès lundi, et vous pouvez déjà commander sur le site 😉

{LIEN}`,
  },
]

export function texteFacebook(p) {
  return p.texte.replace('{LIEN}', '').trim()
}

export function texteInstagram(p) {
  const corps = p.texte.replace('{LIEN}', LIEN_IG).replace(/bontin\.fr\/fetes/g, 'bontin.fr').trim()
  return `${corps}\n\n${p.tags} ${TAGS_BASE}`
}
