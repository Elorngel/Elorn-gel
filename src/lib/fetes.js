// « Mode fêtes » (13/11/2026) : page d'accueil de fin d'année, activable dans l'admin (onglet « Fêtes »).
// Réglages : parametres_site.fetes_actif (case) et parametres_site.fetes (contenu ci-dessous, modifiable).
// Tant que la case est décochée, la page d'accueil normale (Hero.jsx) s'affiche et la rubrique « Les fêtes » est cachée.
// produits : tous les produits de la rubrique « Les fêtes » (page /fetes), dans l'ordre choisi ; ceux cochés
// « couverture » (4 au plus) sont les photos de la bannière, avec leur phrase dorée et leur nom affiché.

export const OR = '#d9b86a'

export const FETES_DEFAUT = {
  sur: 'Édition limitée · Fêtes 2026',
  titre: 'Le menu des fêtes',
  texte: "Une sélection de fin d'année, prête à cuire ou à déguster. Livrée chez vous ou à retirer au dépôt de Plouédern.",
  bouton: 'Composer mon menu',
  lien: '/fetes',
  // Jour visé par le décompte « J - 42 » (le décompte disparaît une fois la date passée).
  date_cible: '2026-12-25',
  produits: [
    { id: '91640918-af8b-48e1-b8fe-27006618e5b5', couverture: true, phrase: 'Le plat du réveillon', nom: 'Rôti de 2 magrets de canard' },
    { id: '8dc3420a-c717-460f-9747-78285d83cc7f', couverture: true, phrase: 'Pour trinquer', nom: '32 canapés signature' },
    { id: 'b24e1d49-f418-4dea-b8c9-956b3ee15bcb', couverture: true, phrase: 'Une entrée qui brille', nom: 'Noix de Saint-Jacques' },
    { id: '1a0a2cff-d494-4506-a95f-832b61b6b42e', couverture: true, phrase: 'Pour finir en douceur', nom: 'Macarons assortis' },
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
  return c
}

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
