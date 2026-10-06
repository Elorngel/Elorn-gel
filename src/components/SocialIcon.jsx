// Accepte "https://…" ou "facebook.com/…" (on ajoute https://) ; refuse tout
// autre schéma (javascript:, etc.) pour qu'un lien mal saisi ne puisse rien exécuter.
function socialUrl(value) {
  const v = (value || '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (v.includes(':')) return null
  return `https://${v}`
}

const SOCIAL_ICONS = {
  Facebook: (
    <path
      fill="currentColor"
      d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.7V13h2.7v8h3.1z"
    />
  ),
  Instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </>
  ),
}

// Icône de réseau social (name : "Facebook" ou "Instagram"), cliquable si un
// lien est renseigné dans l'admin. Sans lien : grisée (bandeau) ou masquée
// (hideIfEmpty, pour le pied de page). Avec label : affiche le nom à côté.
export default function SocialIcon({ name, url, label = false, hideIfEmpty = false, className = '' }) {
  const href = socialUrl(url)
  if (!href && hideIfEmpty) return null

  const content = (
    <>
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
        {SOCIAL_ICONS[name]}
      </svg>
      {label && <span>{name}</span>}
    </>
  )

  if (!href) {
    return (
      <span className={`inline-flex items-center gap-2 text-stone/40 ${className}`} title={`${name} : lien à venir`}>
        {content}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} (nouvel onglet)`}
      className={`inline-flex items-center gap-2 text-stone hover:text-paper ${label ? 'hover:underline' : ''} ${className}`}
    >
      {content}
    </a>
  )
}
