// Supabase répond d'habitude en 0,1 à 0,3 s, mais une demande reste parfois bloquée
// 5 à 30 s sans réponse (lenteurs de leurs serveurs, constatées le 22/10/2026). Plutôt que
// de laisser la page en attente, on relance la même demande si elle n'a pas commencé à
// répondre à temps : la relance passe presque toujours tout de suite.
// Seules les lectures (GET/HEAD) sont relancées : renvoyer une commande ou un envoi de
// photo risquerait de les enregistrer deux fois.
const DELAIS_MS = [3500, 7000] // 1re et 2e tentative ; la 3e attend aussi longtemps qu'il faut

export async function fetchAvecRelance(input, init = {}, fetchBase = fetch) {
  const methode = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (methode !== 'GET' && methode !== 'HEAD') return fetchBase(input, init)

  const signalAppelant = init.signal
  for (const delai of DELAIS_MS) {
    if (signalAppelant?.aborted) break
    const controleur = new AbortController()
    const minuteur = setTimeout(() => controleur.abort(), delai)
    const relayer = () => controleur.abort()
    signalAppelant?.addEventListener('abort', relayer, { once: true })
    try {
      // fetch rend la main dès que la réponse commence : le minuteur ne coupe donc jamais
      // le téléchargement d'une réponse arrivée à temps, même sur une connexion lente.
      return await fetchBase(input, { ...init, signal: controleur.signal })
    } catch (erreur) {
      const delaiDepasse = controleur.signal.aborted && !signalAppelant?.aborted
      if (!delaiDepasse) throw erreur
    } finally {
      clearTimeout(minuteur)
      signalAppelant?.removeEventListener('abort', relayer)
    }
  }
  return fetchBase(input, init)
}
