// Kit Facebook / Instagram des fêtes (décembre 2026) — la liste des publications, source unique.
// Sert à fabriquer les visuels, le guide HTML et le programme texte : `node docs/fetes-decembre/source/generer.mjs`.
// Règles de Romuald (20/11/2026) : 3 à 4 publications par semaine jusqu'au 24/12, un message le 31/12 et le 01/01,
// charte des fêtes (vert forêt, or, carte à coins coupés), produits du rayon « Fêtes », surtout les bûches,
// JAMAIS le même produit deux fois dans le mois. Fermeture du 25/12 au 03/01, réouverture le lundi 04/01/2027.
// Prix relevés sur le site le 20/11/2026 (prix en livraison ; remise retrait à 0 %, donc identiques en retrait).

// {LIEN} est remplacé par le lien du site (Facebook) ou « lien dans la bio » (Instagram).
export const LIEN_FB = '👉 bontin.fr/fetes'
export const LIEN_IG = '👉 Lien dans la bio (bontin.fr)'
const TAGS_BASE = '#Bontin #Plouédern #Landerneau #Finistère #Bretagne #commercelocal'

// Produits mis en avant (id = 8 premiers caractères de l'id Supabase). Chacun n'apparaît qu'une seule fois.
export const PRODUITS = {
  breizh: { id: 'ecd0f35c', nom: 'BÛCHE BREIZH- 8 PARTS' },
  rocher: { id: '8cca28d5', nom: 'BÛCHE FAÇON ROCHER- 8 PARTS' },
  framb: { id: '9c3e2e04', nom: 'BÛCHE FRAMBISSIMA- 8 PARTS' },
  tonka: { id: '47cbc562', nom: 'BÛCHE CHOCO TONKA- 8 PARTS' },
  citron: { id: 'd377938f', nom: 'BÛCHE CITRON MERINGUE 8 PARTS' },
  pomme: { id: '10a4662d', nom: 'BÛCHE CARAMEL / POMME CIDREE - 6-8 PARTS' },
  cafe: { id: '3efb84a9', nom: 'BÛCHE PÂTISSIÈRE AU CAFÉ-6-8 PARTS' },
  buchettes: { id: '3f6ded01', nom: 'BÛCHETTES INDIVIDUELLES x 6' },
  canapes: { id: '8dc3420a', nom: '32 CANAPES SIGNATURE' },
  cassolette: { id: 'a523d1b9', nom: 'CASSOLETTE ST JACQUES SAUCE CHAMPAGNE' },
  magrets: { id: '91640918', nom: "RÔTI DE 2 MAGRETS DE CANARD AU PIMENT D'ESPELETTE" },
  quiches: { id: 'a51290b8', nom: '25 MINI QUICHES APERITIVES' },
  feuilletes: { id: 'ce891ba6', nom: '4 FEUILLETÉS ST JACQUES' },
  dinde: { id: '349d3038', nom: 'ROTI DE DINDE FARCI MARRONS CEPES' },
  petitsfours: { id: '836e50ee', nom: '12 PETITS FOURS DESSERT' },
  chocolats: { id: '1b88309b', nom: 'CHOCOLATS PRÊTS A OFFRIR 250G' },
}

// Visuels. type : dates | produit | interieur | duo | menu | voeux | couverture. format : post (1080×1350),
// story (1080×1920), couv (1640×624).
export const VISUELS = {
  '01-dates': {
    type: 'dates', format: 'post',
    sur: 'Décembre chez Bontin', titre: 'Les dates à retenir',
    lignes: [
      { j: 'Dès', n: '✦', m: 'maintenant', t: 'Commandez tôt', x: 'Les créneaux de la semaine de Noël partent vite.' },
      { j: 'Mercredi', n: '23', m: 'déc.', t: 'Dernières livraisons', x: 'Commande la veille au plus tard.' },
      { j: 'Jeudi', n: '24', m: 'déc.', t: 'Dernier retrait', x: "Au dépôt de Plouédern jusqu'à midi." },
      { j: 'Lundi', n: '04', m: 'janv.', t: 'Réouverture', x: 'Fermé du 25 décembre au 3 janvier.' },
    ],
  },
  '01-story-dates': { base: '01-dates', format: 'story' },

  '02-buche-breizh': {
    type: 'produit', format: 'post', produit: 'breizh', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'La bûche de chez nous', titre: 'Bûche Breizh',
    phrase: 'Palet breton, caramel au beurre salé et éclats de caramel.',
    prix: '26,90 €', infos: 'Glacée<br>8 parts',
  },
  '02b-buche-breizh-interieur': { type: 'interieur', format: 'post', produit: 'breizh', titre: 'La bûche Breizh' },

  '03-canapes': {
    type: 'produit', format: 'post', produit: 'canapes', pos: '50% 55%',
    chip: "L'apéritif", sur: 'Pour trinquer', titre: '32 canapés signature',
    phrase: 'Foie gras et fruits rouges, saumon fumé, écrevisse aux agrumes… Rien à cuire.',
    prix: '26,70 €', infos: 'Les 32<br>5 h au frigo',
  },

  '04-buche-rocher': {
    type: 'produit', format: 'post', produit: 'rocher', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Pour les fans de praliné', titre: 'Bûche façon Rocher',
    phrase: 'Praliné, vanille, cœur caramel au lait, coque chocolat au lait et riz soufflé.',
    prix: '26,90 €', infos: 'Glacée<br>8 parts',
  },
  '04b-buche-rocher-interieur': { type: 'interieur', format: 'post', produit: 'rocher', titre: 'La bûche façon Rocher' },

  '05-cassolettes': {
    type: 'produit', format: 'post', produit: 'cassolette', pos: '50% 55%',
    chip: "L'entrée", sur: "L'entrée chic sans effort", titre: 'Cassolettes de Saint-Jacques',
    phrase: 'Sauce au champagne, servies dans leur cassolette en céramique.',
    prix: '13,99 €', infos: '4 cassolettes<br>20 min au four',
  },

  '06-buche-frambissima': {
    type: 'produit', format: 'post', produit: 'framb', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Fruitée et légère', titre: 'Bûche Frambissima',
    phrase: 'Framboise, vanille Bourbon de Madagascar, coulis de framboise et meringue.',
    prix: '26,90 €', infos: 'Glacée<br>6 à 8 parts',
  },
  '06b-buche-frambissima-interieur': { type: 'interieur', format: 'post', produit: 'framb', titre: 'La bûche Frambissima' },

  '07-magrets': {
    type: 'produit', format: 'post', produit: 'magrets', pos: '50% 55%',
    chip: 'Le plat', sur: 'Le plat du réveillon', titre: 'Rôti de 2 magrets de canard',
    phrase: "Tendre et généreux, relevé au piment d'Espelette fumé.",
    prix: '22,75 €', infos: '800 g env.<br>15-20 min au four',
  },

  '08-buche-choco-tonka': {
    type: 'produit', format: 'post', produit: 'tonka', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Pour les amateurs de chocolat', titre: 'Bûche Choco Tonka',
    phrase: 'Chocolat noir, fève tonka, cœur caramel au lait et croustillant praliné.',
    prix: '26,90 €', infos: 'Glacée<br>6 à 8 parts',
  },
  '08b-buche-choco-tonka-interieur': { type: 'interieur', format: 'post', produit: 'tonka', titre: 'La bûche Choco Tonka' },

  '09-menu-reveillon': {
    type: 'menu', format: 'post',
    sur: 'Idée menu de réveillon', titre: 'Pour 4, à moins de 50 €',
    plats: [
      { produit: 'quiches', role: "L'apéritif", nom: '25 mini quiches', prix: '13,90 €' },
      { produit: 'feuilletes', role: "L'entrée", nom: '4 feuilletés Saint-Jacques', prix: '8,89 €' },
      { produit: 'dinde', role: 'Le plat', nom: 'Rôti de dinde marrons-cèpes', prix: '14,99 €' },
      { produit: 'petitsfours', role: 'Le dessert', nom: '12 petits fours', prix: '10,39 €' },
    ],
    total: '48,17 €',
  },

  '10-buche-citron': {
    type: 'produit', format: 'post', produit: 'citron', pos: '50% 60%',
    chip: 'Les bûches de Noël', sur: 'Comme une tarte au citron', titre: 'Bûche citron meringuée',
    phrase: 'Citron de Sicile, sorbet citron vert, pâte sucrée et meringue italienne.',
    prix: '26,90 €', infos: 'Glacée<br>8 parts',
  },
  '10b-buche-citron-interieur': { type: 'interieur', format: 'post', produit: 'citron', titre: 'La bûche citron meringuée' },

  '11-j-6': {
    type: 'dates', format: 'post',
    sur: 'Dernière ligne droite', titre: 'Noël, c’est dans', compte: '6',
    lignes: [
      { j: 'Mercredi', n: '23', m: 'déc.', t: 'Dernières livraisons', x: 'Commande au plus tard le mardi 22.' },
      { j: 'Jeudi', n: '24', m: 'déc.', t: 'Dernier retrait', x: "Au dépôt jusqu'à midi, commande au plus tard le mercredi 23." },
    ],
  },
  '11-story-j-6': { base: '11-j-6', format: 'story' },

  '12-buches-11-90': {
    type: 'duo', format: 'post',
    tuiles: [
      { produit: 'pomme', role: 'Glacée', nom: 'Caramel & pomme cidrée', prix: '11,90 €', pos: '50% 55%' },
      { produit: 'cafe', role: 'Pâtissière', nom: 'Bûche au café', prix: '11,90 €', pos: '50% 55%' },
    ],
    sur: 'Petit prix, grand dessert', titre: 'Deux bûches à 11,90 €',
    phrase: 'Pomme et caramel au beurre salé, ou génoise et crème au beurre au café.',
    bas: '<span class="bandeau">6 à 8 parts chacune · glacée ou pâtissière</span>',
  },

  '13-dernier-jour-livraison': {
    type: 'duo', format: 'post',
    tuiles: [
      { produit: 'buchettes', role: 'Pour les enfants', nom: '6 bûchettes glacées', prix: '5,19 €', pos: '50% 55%' },
      { produit: 'chocolats', role: 'À offrir', nom: 'Chocolats fins en boîte', prix: '8,50 €', pos: '50% 55%' },
    ],
    sur: 'Aujourd’hui', titre: 'Dernier jour en livraison',
    phrase: 'Commandez aujourd’hui, on vous livre demain, juste à temps pour Noël.',
    bas: '<span class="bandeau">Livraison le mercredi 23 · retrait jusqu’au 24 à midi</span>',
  },

  '14-dernier-jour-commande': {
    type: 'dates', format: 'post',
    sur: 'Dernier jour pour commander', titre: 'Retrait demain jusqu’à midi',
    lignes: [
      { j: 'Aujourd’hui', n: '23', m: 'déc.', t: 'Commandez sur bontin.fr', x: 'Les livraisons du jour sont en route.' },
      { j: 'Demain', n: '24', m: 'déc.', t: 'Retrait au dépôt', x: "À Plouédern, de 8 h à midi." },
    ],
  },
  '14-story-dernier-jour': { base: '14-dernier-jour-commande', format: 'story' },

  '15-joyeux-noel': {
    type: 'voeux', format: 'post',
    sur: 'Toute l’équipe Bontin vous souhaite un', titre: 'Joyeux<br><span>Noël</span>',
    texte: 'Merci pour votre confiance cette année.<br>Belles fêtes en famille !',
    info: 'Fermé du 25 décembre au 3 janvier<br><b>Réouverture le lundi 4 janvier</b>',
  },
  '15-story-joyeux-noel': { base: '15-joyeux-noel', format: 'story' },
  '15-couverture-fermeture': {
    type: 'couverture', format: 'couv',
    sur: 'Fermé du 25 décembre au 3 janvier', titre: 'On se retrouve le 4 janvier',
    texte: 'Joyeuses fêtes ! Le site reste ouvert : commandez dès maintenant sur bontin.fr',
  },

  '16-bon-reveillon': {
    type: 'voeux', format: 'post',
    sur: 'Pour la dernière soirée de 2026', titre: 'Bon<br><span>réveillon</span>',
    texte: 'Plein de bons moments, de rires<br>et de bonnes choses à partager.',
    info: 'On se retrouve le lundi 4 janvier',
  },
  '16-story-bon-reveillon': { base: '16-bon-reveillon', format: 'story' },

  '17-bonne-annee': {
    type: 'voeux', format: 'post', annee: '2027',
    sur: 'Toute l’équipe Bontin vous souhaite une', titre: 'Bonne année',
    texte: 'Pleine de santé et de bons repas partagés.',
    info: 'Le dépôt rouvre ce <b>lundi 4 janvier</b>',
  },
  '17-story-bonne-annee': { base: '17-bonne-annee', format: 'story' },
}

// Le calendrier. semaine : sert aux titres du guide. visuels : clés de VISUELS (le 1er = la publication ;
// « carrousel » = toutes les images dans la même publication). story / couverture : à faire le même jour.
export const PUBLICATIONS = [
  {
    date: '2026-12-01', heure: '18 h 30', titre: 'Les dates à retenir', visuels: ['01-dates'], story: '01-story-dates',
    tags: '#Noël #menudefêtes #bûchedeNoël',
    texte: `🎄 Décembre est là, et le menu des fêtes Bontin aussi !

Apéritif, entrées de la mer, plats du réveillon et bûches glacées : tout est réuni dans la rubrique « Les fêtes » du site.

📅 Les dates à retenir :
• Mercredi 23 décembre : dernières livraisons avant Noël
• Jeudi 24 décembre : dernier retrait au dépôt de Plouédern, jusqu'à midi
• Commande au plus tard la veille
• Du 25 décembre au 3 janvier : on ferme pour les fêtes, réouverture le lundi 4 janvier

💡 L'avantage du surgelé : vous commandez dès maintenant, vous rangez au congélateur, et le jour J tout est prêt. Pas de course de dernière minute !

{LIEN}`,
  },
  {
    date: '2026-12-03', heure: '12 h', titre: 'Bûche Breizh', visuels: ['02-buche-breizh', '02b-buche-breizh-interieur'], carrousel: true,
    produits: ['breizh'], tags: '#bûchedeNoël #bûcheglacée #caramelbeurresalé #Noël',
    texte: `🧈 La bûche de chez nous : la bûche Breizh !

Crème glacée au palet breton, cœur de crème glacée au caramel au beurre salé, éclats de caramel et coulis caramel au beurre salé. Glissez pour voir l'intérieur 👉

8 parts · 26,90 €
Une bûche glacée : elle attend tranquillement au congélateur jusqu'au jour J.

Vous êtes plutôt Breizh ou chocolat ? Dites-le-nous en commentaire 👇

{LIEN}`,
  },
  {
    date: '2026-12-05', heure: '11 h 30', titre: '32 canapés signature', visuels: ['03-canapes'],
    produits: ['canapes'], tags: '#apéritif #apérodefêtes #Noël #réveillon',
    texte: `🥂 L'apéritif des fêtes, sans passer l'après-midi en cuisine.

32 canapés signature : foie gras et fruits rouges, jambon sec, écrevisse aux agrumes, saumon fumé, légumes du soleil, œuf mimosa au curry, pesto…

26,70 € les 32
⏱ Il suffit de les sortir 5 heures avant, au réfrigérateur. Rien à cuire !

{LIEN}`,
  },
  {
    date: '2026-12-07', heure: '18 h 30', titre: 'Bûche façon Rocher', visuels: ['04-buche-rocher', '04b-buche-rocher-interieur'], carrousel: true,
    produits: ['rocher'], tags: '#bûchedeNoël #bûcheglacée #praliné #Noël',
    texte: `🍫 Les fans de praliné, celle-ci est pour vous.

La bûche façon Rocher : crème glacée praliné et vanille, cœur de caramel au lait, meringue, le tout dans une coque au chocolat au lait et riz soufflé croustillant.

8 parts · 26,90 €
Glissez pour voir ce qu'il y a dedans 👉

{LIEN}`,
  },
  {
    date: '2026-12-09', heure: '12 h', titre: 'Cassolettes de Saint-Jacques', visuels: ['05-cassolettes'],
    produits: ['cassolette'], tags: '#SaintJacques #entréedefêtes #Noël #réveillon',
    texte: `✨ Une entrée chic, prête en 20 minutes.

Nos cassolettes de Saint-Jacques à la sauce au champagne, servies dans leur cassolette en céramique : direction le four, sans décongélation, et c'est servi.

4 cassolettes · 13,99 €

{LIEN}`,
  },
  {
    date: '2026-12-11', heure: '18 h 30', titre: 'Bûche Frambissima', visuels: ['06-buche-frambissima', '06b-buche-frambissima-interieur'], carrousel: true,
    produits: ['framb'], tags: '#bûchedeNoël #bûcheglacée #framboise #Noël',
    texte: `🍓 Envie de fraîcheur après un bon repas ?

La bûche Frambissima : crème glacée à la framboise, glace à la vanille Bourbon de Madagascar, cœur de coulis de framboise et meringue. Fruitée, légère, et toujours aussi gourmande.

6 à 8 parts · 26,90 €
Glissez pour voir l'intérieur 👉

{LIEN}`,
  },
  {
    date: '2026-12-13', heure: '11 h', titre: 'Rôti de 2 magrets de canard', visuels: ['07-magrets'],
    produits: ['magrets'], tags: '#magretdecanard #platdefêtes #Noël #réveillon',
    texte: `🦆 Le plat du réveillon qui fait son effet.

Rôti de 2 magrets de canard au piment d'Espelette fumé : tendre, généreux, et prêt en 15 à 20 minutes au four, sans décongélation.

Environ 800 g · 22,75 €
Avec une poêlée de légumes ou des pommes de terre rissolées, le tour est joué 😋

{LIEN}`,
  },
  {
    date: '2026-12-14', heure: '18 h 30', titre: 'Bûche Choco Tonka', visuels: ['08-buche-choco-tonka', '08b-buche-choco-tonka-interieur'], carrousel: true,
    produits: ['tonka'], tags: '#bûchedeNoël #bûcheglacée #chocolat #Noël',
    texte: `🍫 Pour les amateurs de chocolat noir.

La bûche Choco Tonka : crème glacée au chocolat et à la fève tonka, vanille Bourbon, coulis de caramel au lait et croustillant chocolat-praliné. Fondant et croquant à chaque cuillère.

6 à 8 parts · 26,90 €
Glissez pour voir l'intérieur 👉

{LIEN}`,
  },
  {
    date: '2026-12-16', heure: '12 h', titre: 'Un réveillon pour 4 à moins de 50 €', visuels: ['09-menu-reveillon'],
    produits: ['quiches', 'feuilletes', 'dinde', 'petitsfours'], tags: '#menudefêtes #réveillon #Noël #bonplan',
    texte: `🍽 Un réveillon complet pour 4, à moins de 50 € ?

Voici notre idée de menu :
🥂 Apéritif : 25 mini quiches apéritives (13,90 €)
🐚 Entrée : 4 feuilletés de Saint-Jacques (8,89 €)
🦃 Plat : rôti de dinde farci aux marrons et aux cèpes (14,99 €)
🍰 Dessert : 12 petits fours (10,39 €)

Total : 48,17 € pour tout le repas.
Tout se garde au congélateur jusqu'au jour J. Pensez juste à sortir le rôti la veille au réfrigérateur.

{LIEN}`,
  },
  {
    date: '2026-12-18', heure: '18 h 30', titre: 'Bûche citron meringuée', visuels: ['10-buche-citron', '10b-buche-citron-interieur'], carrousel: true,
    produits: ['citron'], tags: '#bûchedeNoël #bûcheglacée #citron #Noël',
    texte: `🍋 Comme une tarte au citron… mais en bûche glacée !

Crème glacée au citron de Sicile, sorbet au citron vert, pâte sucrée et une belle meringue italienne. La bûche idéale pour finir un repas copieux sur une note fraîche.

8 parts · 26,90 €
Glissez pour voir l'intérieur 👉

{LIEN}`,
  },
  {
    date: '2026-12-19', heure: '11 h', titre: 'Noël dans 6 jours', visuels: ['11-j-6'], story: '11-story-j-6',
    tags: '#Noël #menudefêtes',
    texte: `⏳ Noël, c'est dans 6 jours !

Pour être tranquille, pensez à commander :
🚚 Livraison : dernières livraisons le mercredi 23 décembre (commande au plus tard le mardi 22)
🏠 Retrait au dépôt de Plouédern : jusqu'au jeudi 24 décembre à midi (commande au plus tard le mercredi 23)

Les créneaux de la semaine de Noël partent vite 😉

{LIEN}`,
  },
  {
    date: '2026-12-21', heure: '12 h', titre: 'Deux bûches à 11,90 €', visuels: ['12-buches-11-90'],
    produits: ['pomme', 'cafe'], tags: '#bûchedeNoël #petitprix #Noël',
    texte: `🎄 Une belle bûche pour 11,90 € ? On en a deux !

🍏 La bûche caramel et pomme cidrée : une bûche glacée pomme et caramel au beurre salé, avec des éclats croquants et un décor au chocolat.
☕ La bûche pâtissière au café : génoise moelleuse, crème au beurre au café et décor chocolat, comme chez le pâtissier.

6 à 8 parts chacune · 11,90 €
(la bûche au café se décongèle environ 6 heures au réfrigérateur)

{LIEN}`,
  },
  {
    date: '2026-12-22', heure: '11 h 30', titre: 'Dernier jour pour commander en livraison', visuels: ['13-dernier-jour-livraison'],
    produits: ['buchettes', 'chocolats'], tags: '#Noël #dernièreminute',
    texte: `🚚 Aujourd'hui, dernier jour pour commander en livraison !

Les commandes passées aujourd'hui sont livrées demain, mercredi 23 décembre, juste à temps pour Noël.

Et pour la petite touche de dernière minute :
🍦 6 bûchettes glacées individuelles (fraise-vanille, vanille-chocolat, chocolat-noisette) : 5,19 €
🎁 Une boîte de chocolats fins prête à offrir, nouée d'un ruban : 8,50 €

Après aujourd'hui, il reste le retrait au dépôt de Plouédern jusqu'au jeudi 24 à midi.

{LIEN}`,
  },
  {
    date: '2026-12-23', heure: '12 h', titre: 'Dernier jour pour commander', visuels: ['14-dernier-jour-commande'], story: '14-story-dernier-jour',
    tags: '#Noël #dernièreminute',
    texte: `⏰ Dernier jour pour commander avant Noël !

Commandez aujourd'hui et retirez votre commande demain, jeudi 24 décembre, au dépôt de Plouédern, de 8 h à midi.

Merci à tous ceux qui ont déjà commandé : les livraisons sont en route aujourd'hui 🚚🎄

{LIEN}`,
  },
  {
    date: '2026-12-24', heure: '14 h', titre: 'Joyeux Noël + fermeture', visuels: ['15-joyeux-noel'], story: '15-story-joyeux-noel', couverture: '15-couverture-fermeture',
    tags: '#JoyeuxNoël #Noël',
    texte: `🎄 Joyeux Noël à tous !

Toute l'équipe Bontin vous remercie pour votre confiance cette année. Belles fêtes en famille, et bonne dégustation 😋

Le dépôt est fermé du vendredi 25 décembre au dimanche 3 janvier. On se retrouve le lundi 4 janvier !
Le site reste ouvert : vous pouvez déjà commander pour une livraison ou un retrait à partir du 4 janvier.

{LIEN}`,
  },
  {
    date: '2026-12-31', heure: '17 h', titre: 'Bon réveillon', visuels: ['16-bon-reveillon'], story: '16-story-bon-reveillon',
    tags: '#bonréveillon #nouvelan #réveillon',
    texte: `✨ Bon réveillon à tous !

Que cette dernière soirée de 2026 soit pleine de bons moments, de rires et de bonnes choses à partager.

Merci d'avoir fait de cette année une belle année pour Bontin 🙏
On se retrouve le lundi 4 janvier.`,
  },
  {
    date: '2027-01-01', heure: '10 h', titre: 'Bonne année 2027', visuels: ['17-bonne-annee'], story: '17-story-bonne-annee',
    tags: '#bonneannée #bonneannée2027 #nouvelan',
    texte: `🥂 Bonne année 2027 !

Toute l'équipe Bontin vous souhaite une belle et heureuse année, pleine de santé et de bons repas partagés.

Le dépôt rouvre ce lundi 4 janvier : livraisons et retraits reprennent dès lundi, et vous pouvez déjà commander sur le site 😉

{LIEN}`,
  },
]

export function texteFacebook(p) {
  return p.texte.replace('{LIEN}', LIEN_FB).trim()
}

export function texteInstagram(p) {
  const corps = p.texte.replace('{LIEN}', LIEN_IG).replace(/bontin\.fr\/fetes/g, 'bontin.fr').trim()
  return `${corps}\n\n${p.tags} ${TAGS_BASE}`
}
