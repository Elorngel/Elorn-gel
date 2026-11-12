import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import MotDePasseOublie from '../components/MotDePasseOublie'
import { supabase } from '../lib/supabaseClient'
import { useSeo } from '../lib/seo'
import ChampMotDePasse from '../components/ChampMotDePasse'

// Page ouverte depuis l'email « mot de passe oublié » : /nouveau-mot-de-passe?jeton=…
// Le jeton (valable 1 heure, une seule fois) n'est utilisé qu'au moment de valider le nouveau mot de passe :
// un antivirus de messagerie qui ouvre le lien à l'avance ne peut pas le consommer.
const champ = 'w-full border border-ink/20 p-2 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const bouton =
  'bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-forest transition-colors disabled:bg-muted'

export default function NouveauMotDePassePage() {
  useSeo({ titre: 'Nouveau mot de passe', indexer: false })
  const jeton = new URLSearchParams(window.location.search).get('jeton') || ''
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [lienPerime, setLienPerime] = useState(!jeton)
  const [fait, setFait] = useState(false)

  const valider = async (e) => {
    e.preventDefault()
    setErreur('')
    if (mdp.length < 8) return setErreur('Le mot de passe doit faire au moins 8 caractères.')
    if (mdp !== mdp2) return setErreur('Les deux mots de passe ne sont pas identiques.')
    setEnvoi(true)
    const { error: errLien } = await supabase.auth.verifyOtp({ token_hash: jeton, type: 'recovery' })
    if (errLien) {
      setEnvoi(false)
      setLienPerime(true)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setEnvoi(false)
    if (error) {
      setErreur(
        /different|same/i.test(error.message)
          ? 'Choisissez un mot de passe différent de l’ancien.'
          : 'Le mot de passe n’a pas pu être changé. Réessayez ou appelez-nous.'
      )
      return
    }
    // L'adresse ne garde pas le jeton (déjà utilisé).
    window.history.replaceState(null, '', '/nouveau-mot-de-passe')
    setFait(true)
  }

  return (
    <div className="min-h-screen bg-stone flex flex-col">
      <Header activeCategory={null} />
      <main className="flex-1 max-w-md w-full mx-auto px-5 py-10">
        <h1 className="font-display text-4xl text-ink mb-5">Nouveau mot de passe</h1>
        <section className="bg-paper border border-ink/15 p-4">
          {fait ? (
            <div className="flex flex-col gap-3">
              <p className="font-body text-sm text-forest">
                C’est fait : votre mot de passe est changé et vous êtes connecté.
              </p>
              <a href="/mon-compte" className={`${bouton} w-fit`}>
                Aller à mon compte
              </a>
              <a href="/catalogue" className="font-tag text-xs uppercase underline text-muted hover:text-ink">
                Voir le catalogue
              </a>
            </div>
          ) : lienPerime ? (
            <div className="flex flex-col gap-3">
              <p className="font-body text-sm text-rust">
                Ce lien n’est plus valable : il a expiré (1 heure) ou a déjà servi.
              </p>
              <p className="font-body text-sm text-ink">Demandez un nouveau lien :</p>
              <MotDePasseOublie />
            </div>
          ) : (
            <form onSubmit={valider} className="flex flex-col gap-3">
              <p className="font-body text-sm text-ink">Choisissez votre nouveau mot de passe (8 caractères minimum).</p>
              <ChampMotDePasse
                autoComplete="new-password"
                placeholder="Nouveau mot de passe"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                className={champ}
                required
              />
              <ChampMotDePasse
                autoComplete="new-password"
                placeholder="Le même, une 2e fois"
                value={mdp2}
                onChange={(e) => setMdp2(e.target.value)}
                className={champ}
                required
              />
              {erreur && <p className="font-body text-sm text-rust">{erreur}</p>}
              <button type="submit" disabled={envoi} className={bouton}>
                {envoi ? 'Enregistrement…' : 'Enregistrer mon nouveau mot de passe'}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
