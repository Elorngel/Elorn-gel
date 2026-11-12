import { useState } from 'react'

// Champ mot de passe avec un œil pour afficher / masquer ce qu'on tape (12/11/2026).
// S'utilise comme un <input> ; classeConteneur sert aux marges autour du champ.
export default function ChampMotDePasse({ className = '', classeConteneur = '', ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`relative ${classeConteneur}`}>
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} w-full pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-muted hover:text-ink"
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4.3 9.6 6.4a1.3 1.3 0 0 1 0 1.2 15 15 0 0 1-2.6 3.4M6.5 6.6a15.3 15.3 0 0 0-4.1 4.8 1.3 1.3 0 0 0 0 1.2C3.5 14.7 7 19 12 19a9.6 9.6 0 0 0 5.4-1.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
            <path d="M2.4 11.4C3.5 9.3 7 5 12 5s8.5 4.3 9.6 6.4a1.3 1.3 0 0 1 0 1.2C20.5 14.7 17 19 12 19s-8.5-4.3-9.6-6.4a1.3 1.3 0 0 1 0-1.2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
