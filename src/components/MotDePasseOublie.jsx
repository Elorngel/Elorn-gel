import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Lien « Mot de passe oublié ? » sous les formulaires de connexion (panier, Mon compte).
// Pas de <form> ici : dans le panier, ce bloc est déjà à l'intérieur du formulaire de commande.
export default function MotDePasseOublie({ emailInitial = '' }) {
  const [ouvert, setOuvert] = useState(false)
  const [email, setEmail] = useState(emailInitial)
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')

  const envoyer = async () => {
    setErreur('')
    setMessage('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErreur('Tapez l’adresse email de votre compte.')
      return
    }
    setEnvoi(true)
    const { data, error } = await supabase.functions.invoke('mot-de-passe-oublie', { body: { email: email.trim() } })
    setEnvoi(false)
    if (error || !data?.ok) {
      setErreur(data?.erreur || 'Envoi impossible pour le moment. Réessayez dans un instant.')
      return
    }
    setMessage(
      'Si un compte existe avec cette adresse, vous allez recevoir un email pour choisir un nouveau mot de passe (pensez à regarder dans les indésirables).'
    )
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => {
          setEmail((e) => e || emailInitial)
          setOuvert(true)
        }}
        className="w-fit font-tag text-xs uppercase underline text-muted hover:text-ink"
      >
        Mot de passe oublié ?
      </button>
    )
  }

  return (
    <div className="border border-ink/15 bg-stone/50 p-3 flex flex-col gap-2">
      <p className="font-body text-xs text-ink">
        Tapez l’adresse email de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.
      </p>
      {message ? (
        <p className="font-body text-sm text-forest">{message}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            autoComplete="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                envoyer()
              }
            }}
            className="flex-1 min-w-[180px] border border-ink/20 bg-paper p-2 font-body text-sm focus:border-forest focus:outline-none"
          />
          <button
            type="button"
            onClick={envoyer}
            disabled={envoi}
            className="bg-ink text-paper font-tag text-xs font-semibold uppercase px-3 py-2 hover:bg-forest disabled:bg-muted"
          >
            {envoi ? 'Envoi…' : 'Recevoir un lien'}
          </button>
        </div>
      )}
      {erreur && <p className="font-body text-xs text-rust">{erreur}</p>}
      <button type="button" onClick={() => setOuvert(false)} className="w-fit font-tag text-[11px] uppercase text-muted hover:text-ink">
        Fermer
      </button>
    </div>
  )
}
