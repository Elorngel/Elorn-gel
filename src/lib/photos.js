// Sur l'hébergement IONOS (bontin.fr et ses sous-domaines), les photos sont servies par IONOS à partir
// d'une copie locale (public/photo-cache.php), pour ne pas consommer le quota de l'offre gratuite
// Supabase à chaque visite. Ailleurs (préversions Vercel, ordinateur), rien ne change.
const PREFIXE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos-produits/`
const SUR_IONOS = typeof window !== 'undefined' && /(^|\.)bontin\.fr$/i.test(window.location.hostname)

export function urlPhoto(url) {
  if (!SUR_IONOS || !url || !url.startsWith(PREFIXE)) return url
  const nom = url.slice(PREFIXE.length)
  return /^[A-Za-z0-9._-]+$/.test(nom) ? `/photos/${nom}` : url
}

// Roue de secours : si la copie IONOS ne répond pas, on reprend la photo chez Supabase.
// Renvoie true si une autre adresse a été tentée.
export function photoDeSecours(img, url) {
  if (!url || img.dataset.secours) return false
  img.dataset.secours = '1'
  if (img.getAttribute('src') === url) return false
  img.src = url
  return true
}
