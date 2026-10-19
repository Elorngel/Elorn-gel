const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

// Dépôt ouvert du lundi au vendredi (fermé samedi et dimanche).
export const JOURS_OUVRES = [1, 2, 3, 4, 5]
export const NOM_JOUR = (n) => JOURS[n].charAt(0).toUpperCase() + JOURS[n].slice(1)

// Date au format AAAA-MM-JJ à l'heure locale (toISOString décalerait d'un jour entre minuit et 2h).
export function cleDate(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dateDepuisCle(cle) {
  const [a, m, j] = cle.split('-').map(Number)
  return new Date(a, m - 1, j)
}

export function libelleDate(d) {
  const label = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Créneaux de 30 minutes, de 8h à 18h.
export function getPickupTimeSlots() {
  const slots = []
  for (let minutes = 8 * 60; minutes < 18 * 60; minutes += 30) {
    const format = (m) => {
      const h = Math.floor(m / 60)
      const min = m % 60
      return `${h}h${min === 0 ? '00' : min}`
    }
    slots.push(`${format(minutes)} - ${format(minutes + 30)}`)
  }
  return slots
}

// Trois créneaux fixes pour la livraison : matin, midi, après-midi.
export function getDeliveryTimeWindows() {
  return ['9h00 - 12h00 (matin)', '12h00 - 14h00 (midi)', '14h00 - 18h00 (après-midi)']
}

const TOUS_LES_CRENEAUX = { retrait: getPickupTimeSlots(), livraison: getDeliveryTimeWindows() }

// Réglages du calendrier (admin) : `joursFermes` = { 'AAAA-MM-JJ': 'tout' | 'retrait' | 'livraison' },
// `indispo` = { retrait: { '1': [créneaux bloqués le lundi], … }, livraison: { … } },
// `speciaux` = { 'AAAA-MM-JJ': { retrait: [créneaux OUVERTS ce jour-là], livraison: [...] } }
// (horaires d'une date précise, prioritaires sur les créneaux habituels de la semaine).
export function estJourFerme(type, cle, joursFermes) {
  const v = joursFermes?.[cle]
  return v === 'tout' || v === type
}

export function creneauxDuJour(type, jourSemaine, indispo) {
  const bloques = indispo?.[type]?.[String(jourSemaine)] || []
  return TOUS_LES_CRENEAUX[type].filter((c) => !bloques.includes(c))
}

// "9h00 - 12h00 (matin)" -> { debut: 540, fin: 720 } (en minutes)
export function bornesCreneau(creneau) {
  const m = creneau.match(/(\d+)h(\d+)\s*-\s*(\d+)h(\d+)/)
  if (!m) return null
  return { debut: +m[1] * 60 + +m[2], fin: +m[3] * 60 + +m[4] }
}

export const TOUS_CRENEAUX = TOUS_LES_CRENEAUX

// Créneaux ouverts à une date donnée : horaires spéciaux de la date s'il y en a, sinon
// créneaux habituels de ce jour de la semaine.
export function creneauxPourDate(type, cle, { indispo, speciaux } = {}) {
  const special = speciaux?.[cle]?.[type]
  if (Array.isArray(special)) return TOUS_LES_CRENEAUX[type].filter((c) => special.includes(c))
  return creneauxDuJour(type, dateDepuisCle(cle).getDay(), indispo)
}

// Prochains jours proposés au client (à partir de demain : disponible sous 24h), en sautant
// les week-ends, les jours fermés et les jours de la semaine sans aucun créneau ouvert.
export function getDatesDisponibles(type, { joursFermes, indispo, speciaux } = {}, nombre = 7) {
  const dates = []
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  for (let i = 0; i < 90 && dates.length < nombre; i++) {
    cursor.setDate(cursor.getDate() + 1)
    const jour = cursor.getDay()
    const cle = cleDate(cursor)
    if (!JOURS_OUVRES.includes(jour)) continue
    if (estJourFerme(type, cle, joursFermes)) continue
    if (creneauxPourDate(type, cle, { indispo, speciaux }).length === 0) continue
    dates.push({ value: cle, label: libelleDate(cursor) })
  }
  return dates
}

export function getCreneauxDisponibles(type, cle, { indispo, speciaux } = {}) {
  if (!cle) return []
  return creneauxPourDate(type, cle, { indispo, speciaux })
}

// Jours fériés français d'une année (Pâques calculé : algorithme de Meeus/Butcher).
export function joursFeries(annee) {
  const a = annee % 19, b = Math.floor(annee / 100), c = annee % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mois = Math.floor((h + l - 7 * m + 114) / 31)
  const jour = ((h + l - 7 * m + 114) % 31) + 1
  const paques = new Date(annee, mois - 1, jour)
  const plus = (n) => { const x = new Date(paques); x.setDate(x.getDate() + n); return x }
  return [
    [new Date(annee, 0, 1), "Jour de l'an"],
    [plus(1), 'Lundi de Pâques'],
    [new Date(annee, 4, 1), 'Fête du travail'],
    [new Date(annee, 4, 8), 'Victoire 1945'],
    [plus(39), 'Ascension'],
    [plus(50), 'Lundi de Pentecôte'],
    [new Date(annee, 6, 14), 'Fête nationale'],
    [new Date(annee, 7, 15), 'Assomption'],
    [new Date(annee, 10, 1), 'Toussaint'],
    [new Date(annee, 10, 11), 'Armistice 1918'],
    [new Date(annee, 11, 25), 'Noël'],
  ].map(([d, nom]) => ({ cle: cleDate(d), nom }))
}
