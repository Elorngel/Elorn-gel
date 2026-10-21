import { useState } from 'react'
import { useAuth, emailAdmin } from '../context/AuthContext'

// Accès à l'admin : vrai compte Supabase (mot de passe vérifié par le serveur), reconnu comme
// administrateur par la table `admins`. Les droits d'écriture sont contrôlés par la base
// elle-même (règles d'accès), pas seulement par cet écran.
export default function AdminGate({ children }) {
  const { chargement, user, estAdmin, connexion, deconnexion } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setEnvoi(true)
    try {
      await connexion(emailAdmin(username), password)
    } catch {
      setErrorMsg('Identifiant ou mot de passe incorrect.')
    } finally {
      setEnvoi(false)
    }
  }

  if (chargement) {
    return <p className="p-6 font-body text-sm text-muted">Chargement…</p>
  }

  if (estAdmin) return children

  // Connecté, mais avec un compte client : pas d'accès à l'admin.
  if (user) {
    return (
      <div className="min-h-screen bg-stone flex items-center justify-center p-4">
        <div className="bg-paper border border-ink/20 w-full max-w-xs p-6">
          <h1 className="font-display text-2xl text-ink mb-3">Administration</h1>
          <p className="font-body text-sm text-ink mb-4">
            Vous êtes connecté avec un compte client, qui n'a pas accès à l'administration.
          </p>
          <button
            type="button"
            onClick={deconnexion}
            className="w-full bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-paper border border-ink/20 w-full max-w-xs p-6">
        <h1 className="font-display text-2xl text-ink mb-4">Administration</h1>

        <label htmlFor="admin-user" className="block font-tag text-xs uppercase text-muted mb-1">
          Utilisateur
        </label>
        <input
          id="admin-user"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-ink/20 p-2 font-body text-sm mb-3 focus:border-forest focus:outline-none"
          autoFocus
        />

        <label htmlFor="admin-password" className="block font-tag text-xs uppercase text-muted mb-1">
          Mot de passe
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-ink/20 p-2 font-body text-sm mb-3 focus:border-forest focus:outline-none"
        />

        {errorMsg && <p className="font-body text-sm text-rust mb-3">{errorMsg}</p>}

        <button
          type="submit"
          disabled={envoi || !username || !password}
          className="w-full bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted"
        >
          {envoi ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
