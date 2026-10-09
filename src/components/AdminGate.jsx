import { useState } from 'react'

// Nouvelle clé : les anciennes connexions (ancien compte « Admin ») ne donnent plus accès.
const AUTH_KEY = 'bontin-admin-auth-v2'
const OLD_AUTH_KEY = 'elorngel-admin-auth'

// Comptes autorisés pour le moment. ATTENTION : cette vérification se fait dans le
// navigateur, donc elle ne protège que de la curiosité (voir CLAUDE.md, « Sécurité admin »).
const ADMIN_ACCOUNTS = [
  { user: 'sylvie', password: '1234' },
  { user: 'romuald', password: '1234' },
]

export function isAdminAuthenticated() {
  const connecte = localStorage.getItem(AUTH_KEY)
  return ADMIN_ACCOUNTS.some((a) => a.user === connecte)
}

export function adminLogout() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(OLD_AUTH_KEY)
}

export default function AdminGate({ children }) {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const compte = ADMIN_ACCOUNTS.find(
      (c) => c.user === username.trim().toLowerCase() && c.password === password
    )
    if (compte) {
      localStorage.setItem(AUTH_KEY, compte.user)
      localStorage.removeItem(OLD_AUTH_KEY)
      setAuthenticated(true)
      setErrorMsg('')
    } else {
      setErrorMsg('Identifiant ou mot de passe incorrect.')
    }
  }

  if (authenticated) {
    return children
  }

  return (
    <div className="min-h-screen bg-stone flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-paper border border-ink/20 w-full max-w-xs p-6"
      >
        <h1 className="font-display text-2xl text-ink mb-4">Administration</h1>

        <label className="block font-tag text-xs uppercase text-muted mb-1">
          Utilisateur
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-ink/20 p-2 font-body text-sm mb-3 focus:border-forest focus:outline-none"
          autoFocus
        />

        <label className="block font-tag text-xs uppercase text-muted mb-1">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-ink/20 p-2 font-body text-sm mb-3 focus:border-forest focus:outline-none"
        />

        {errorMsg && (
          <p className="font-body text-sm text-rust mb-3">{errorMsg}</p>
        )}

        <button
          type="submit"
          className="w-full bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors"
        >
          Se connecter
        </button>
      </form>
    </div>
  )
}
