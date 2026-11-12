// Tournées des commerciaux (12/11/2026) — pour l'instant visibles seulement dans l'admin.
// Au-delà de X km du dépôt (réglage, 10 km), une livraison est faite par un commercial quand il passe dans le
// secteur : on peut conseiller au client les jours où une tournée passe dans sa commune ou à moins de Y km
// (réglage, 3 km). Simple conseil, jamais une obligation. Pas de tournée connue = pas de conseil.
import { COMMUNES_ZONE } from '../data/communesZone.js'
import { COORDONNEES_COMMUNES, DEPOT } from '../data/coordonneesCommunes.js'

export const COMMERCIAUX = ['Julien', 'Fabrice', 'Gilles', 'Dominique']
export const RAYON_DEPOT_DEFAUT = 10
export const RAYON_TOURNEE_DEFAUT = 3

export const NOMS_COMMUNES = COMMUNES_ZONE.map((c) => c.n).sort((a, b) => a.localeCompare(b, 'fr'))

// Distance à vol d'oiseau en km (formule de haversine).
export function distanceKm(a, b) {
  if (!a || !b) return null
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export function coordonnees(nomCommune) {
  const c = COORDONNEES_COMMUNES[nomCommune]
  return c ? { lat: c[0], lon: c[1] } : null
}

export const distanceDepot = (nomCommune) => distanceKm(DEPOT, coordonnees(nomCommune))

// --- Lecture du tableau Excel des commerciaux -------------------------------------------------------------

// « Saint-Thégonnec Loc-Eguiner » → « SAINT THEGONNEC LOC EGUINER » ; « ST » → « SAINT ».
export function normaliserNom(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((m) => (m === 'ST' ? 'SAINT' : m === 'STE' ? 'SAINTE' : m))
    .join(' ')
}

const COMMUNES_MOTS = COMMUNES_ZONE.map((c) => ({ nom: c.n, mots: normaliserNom(c.n).split(' ') }))
// Noms courts, anciens noms ou bourgs utilisés dans les tableaux des commerciaux → commune officielle.
const ALIAS = {
  PORTSALL: 'PLOUDALMEZEAU',
  BRIGNOGAN: 'PLOUNEOUR BRIGNOGAN PLAGES',
  MILIAC: 'MILIZAC GUIPRONVEL', // faute de frappe vue dans un tableau
  GUIPRONVEL: 'MILIZAC GUIPRONVEL',
}
// Premiers mots trop courants pour signaler une commune ambiguë (« SAINT MARC » à Brest n'est pas une commune).
const MOTS_GENERIQUES = new Set(['SAINT', 'SAINTE', 'LE', 'LA', 'LES', 'L', 'ILE', 'ILES'])

// « BREST ST MARC 08 » → Brest ; « DAOULAS + DIRINON » → Daoulas, Dirinon ;
// « SAINT SAUVEUR LAMPAUL » → Saint-Sauveur + « LAMPAUL » à préciser (3 communes possibles).
export function lireLieu(lieu) {
  const communes = []
  const aPreciser = []
  const parties = String(lieu || '')
    .split(/\+|,|\/|\bET\b|&/i)
    .map((p) => normaliserNom(p).split(' ').filter(Boolean))
  for (let mots of parties) {
    mots = mots.flatMap((m) => (ALIAS[m] ? ALIAS[m].split(' ') : [m]))
    // Numéros de tournée en fin de texte (« 88 », « 08 », « A06 ») : ignorés.
    while (mots.length && /^[A-Z]?\d+[A-Z]?$/.test(mots[mots.length - 1])) mots = mots.slice(0, -1)
    if (!mots.length) continue
    let trouve = false
    let i = 0
    while (i < mots.length) {
      // Nombre de mots en commun au début de chaque commune (« LE RELECQ » ↔ « LE RELECQ KERHUON » : 2).
      const prefixes = COMMUNES_MOTS.map((c) => {
        let k = 0
        while (k < c.mots.length && i + k < mots.length && c.mots[k] === mots[i + k]) k++
        return { c, k }
      })
      // 1. Nom complet : la commune la plus longue.
      const completes = prefixes.filter((x) => x.k > 0 && x.k === x.c.mots.length)
      if (completes.length) {
        const meilleure = completes.reduce((a, b) => (b.k > a.k ? b : a))
        if (!communes.includes(meilleure.c.nom)) communes.push(meilleure.c.nom)
        trouve = true
        i += meilleure.k
        continue
      }
      // 2. Début de nom (« PLOUGASTEL », « LE RELECQ », « LAMPAUL ») : une seule commune possible = reconnue,
      //    plusieurs = à préciser par l'admin. Un mot courant seul (« SAINT », « LE ») ne compte pas.
      const maxK = Math.max(0, ...prefixes.map((x) => x.k))
      if (maxK >= 2 || (maxK === 1 && !MOTS_GENERIQUES.has(mots[i]))) {
        const candidats = prefixes.filter((x) => x.k === maxK).map((x) => x.c.nom)
        if (candidats.length === 1) {
          if (!communes.includes(candidats[0])) communes.push(candidats[0])
          trouve = true
          i += maxK
          continue
        }
        aPreciser.push({ texte: mots.slice(i).join(' '), candidats })
        trouve = true
        break
      }
      i++
    }
    if (!trouve) aPreciser.push({ texte: mots.join(' '), candidats: [] })
  }
  return { communes, aPreciser }
}

// Texte copié depuis Excel (colonnes JOUR … LIEU, séparées par des tabulations) pour un mois « AAAA-MM ».
// Chaque ligne : le jour du mois (1 à 31) au début, le lieu = dernière case contenant des lettres.
export function lireCollage(texte, mois) {
  const [annee, m] = mois.split('-').map(Number)
  const nbJours = new Date(annee, m, 0).getDate()
  const lignes = []
  for (const ligne of String(texte || '').split(/\r?\n/)) {
    const cases = ligne.split('\t').map((c) => c.trim())
    const jour = Number(cases[0])
    if (!Number.isInteger(jour) || jour < 1 || jour > nbJours) continue
    const lieu = [...cases.slice(1)]
      .reverse()
      .find((c) => /[A-Za-zÀ-ÿ]{3,}/.test(c) && !/^#|^(FERIE|FÉRIÉ|TOTAL)$/i.test(c))
    if (!lieu) continue
    const date = `${annee}-${String(m).padStart(2, '0')}-${String(jour).padStart(2, '0')}`
    lignes.push({ date, lieu, ...lireLieu(lieu) })
  }
  return lignes
}

// --- Conseils de jours de livraison ----------------------------------------------------------------------

// Pour une commune de client : est-elle dans la zone du dépôt ? Sinon, les prochains passages de tournée dans
// la commune ou à moins de rayonTournee km (après aujourd'hui), un par date, triés.
export function conseilsLivraison(nomCommune, tournees, { aujourdhui, rayonDepot = RAYON_DEPOT_DEFAUT, rayonTournee = RAYON_TOURNEE_DEFAUT } = {}) {
  const ici = coordonnees(nomCommune)
  const depot = distanceKm(DEPOT, ici)
  if (depot === null) return { inconnue: true, conseils: [] }
  if (depot <= rayonDepot) return { zoneDepot: true, distanceDepot: depot, conseils: [] }
  const parDate = new Map()
  for (const t of tournees) {
    if (aujourdhui && t.jour <= aujourdhui) continue
    for (const c of t.communes || []) {
      const d = distanceKm(ici, coordonnees(c))
      if (d === null || d > rayonTournee) continue
      const actuel = parDate.get(t.jour)
      if (!actuel || d < actuel.distance) parDate.set(t.jour, { date: t.jour, commercial: t.commercial, commune: c, distance: d })
    }
  }
  return { distanceDepot: depot, conseils: [...parDate.values()].sort((a, b) => a.date.localeCompare(b.date)) }
}
