import { useState } from 'react'

const AUTH_KEY = 'elorngel-admin-auth'
const ADMIN_USER = 'Admin'
const ADMIN_PASSWORD = 'Bontin1234'

export function isAdminAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true'
}

export function adminLogout() {
  localStorage.removeItem(AUTH_KEY)
}

export default function AdminGate({ children }) {
  const [authenticated, setAuthenticated] = useState(isAdminAuthenticated())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true')
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