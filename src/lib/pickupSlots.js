const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

// Dépôt ouvert 8h-18h en continu, tous les jours sauf dimanche.
// Retrait disponible sous 24h : la première date proposée est demain.
export function getAvailablePickupDates(count = 7) {
  const dates = []
  const cursor = new Date()
  cursor.setDate(cursor.getDate() + 1)

  while (dates.length < count) {
    if (cursor.getDay() !== 0) {
      const label = `${JOURS[cursor.getDay()]} ${cursor.getDate()} ${MOIS[cursor.getMonth()]}`
      dates.push({
        value: cursor.toISOString().slice(0, 10),
        label: label.charAt(0).toUpperCase() + label.slice(1),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
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
