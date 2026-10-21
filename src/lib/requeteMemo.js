// Évite que plusieurs morceaux de la page demandent la même chose à Supabase au même moment
// (en-tête, bannière, catalogue… chargeaient chacun les réglages ou le catalogue de leur côté).
// Une réponse est partagée pendant quelques secondes ; passé ce délai, ou après une
// modification, on redemande à Supabase pour rester à jour.
const cache = new Map()

export function requeteMemo(cle, fabrique, dureeMs = 5000) {
  const deja = cache.get(cle)
  if (deja && Date.now() - deja.t < dureeMs) return deja.p
  const p = Promise.resolve(fabrique())
  cache.set(cle, { p, t: Date.now() })
  p.catch(() => cache.delete(cle))
  return p
}

export function oublierRequetes(prefixe) {
  for (const cle of cache.keys()) if (cle.startsWith(prefixe)) cache.delete(cle)
}
