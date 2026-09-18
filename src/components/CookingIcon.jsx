// Petites icônes "mode de cuisson", en traits arrondis façon pictogramme
// (inspirées d'une planche de référence fournie par Romuald) plutôt que du
// style "coins carrés" utilisé ailleurs sur le site — ce coin de la fiche
// produit gagne à être plus illustratif et lisible d'un coup d'œil.
// Une seule couleur (currentColor, généralement text-rust) pour rester sobre.

const common = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function FourIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="4" y="6" width="24" height="22" rx="1.5" />
      <line x1="4" y1="12" x2="28" y2="12" />
      <line x1="9" y1="9" x2="11" y2="9" />
      <line x1="14" y1="9" x2="20" y2="9" />
      <rect x="8" y="16" width="16" height="9" rx="1" />
      <path d="M12 20.5c.8-1.4 1.6-1.4 2.4 0s1.6 1.4 2.4 0 1.6-1.4 2.4 0" />
    </svg>
  )
}

function PoeleIcon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 15c0 4.4 4 6.5 9 6.5s9-2.1 9-6.5" />
      <path d="M4 15c0-1 .6-1.5 1.5-1.5h15c.9 0 1.5.5 1.5 1.5" />
      <line x1="22" y1="14" x2="28" y2="10" />
      <path d="M11 8c.5 1.5-1 2-1 3.5" />
      <path d="M15.5 8c.5 1.5-1 2-1 3.5" />
      <path d="M20 8c.5 1.5-1 2-1 3.5" />
    </svg>
  )
}

function AirfryerIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="5" y="4" width="22" height="25" rx="7" />
      <circle cx="10.5" cy="10" r="1.8" />
      <rect x="14.5" y="8.5" width="8.5" height="3" rx="1.5" />
      <line x1="5" y1="14.5" x2="27" y2="14.5" />
      <rect x="13" y="17" width="6" height="9" rx="3" />
    </svg>
  )
}

function FriteuseIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="6" y="16" width="20" height="12" rx="4" />
      <line x1="6" y1="21" x2="26" y2="21" />
      <rect x="9" y="9" width="14" height="9" rx="1" />
      <line x1="12.5" y1="9" x2="12.5" y2="18" />
      <line x1="16" y1="9" x2="16" y2="18" />
      <line x1="19.5" y1="9" x2="19.5" y2="18" />
      <line x1="9" y1="12" x2="23" y2="12" />
      <line x1="9" y1="15" x2="23" y2="15" />
      <path d="M23 9V4h-7" />
    </svg>
  )
}

function MicroOndesIcon(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="7" width="26" height="18" rx="1.5" />
      <rect x="5.5" y="9.5" width="15" height="13" rx="0.8" />
      <path d="M9 16c.7-1.2 1.4-1.2 2.1 0s1.4 1.2 2.1 0 1.4-1.2 2.1 0" />
      <line x1="24.5" y1="12" x2="24.5" y2="12.01" />
      <line x1="24.5" y1="16" x2="24.5" y2="16.01" />
      <line x1="24.5" y1="20" x2="24.5" y2="20.01" />
    </svg>
  )
}

function FlameIcon(props) {
  return (
    <svg {...common} {...props}>
      <path d="M16 3c1.3 4-4 5.3-4 10.7a4 4 0 0 0 8 0c2 1.3 2.7 3.3 2.7 5.3a6.7 6.7 0 0 1-13.4 0c0-6.7 5.4-8 6.7-16Z" />
    </svg>
  )
}

const ICONS = {
  four: FourIcon,
  poele: PoeleIcon,
  airfryer: AirfryerIcon,
  friteuse: FriteuseIcon,
  micro_ondes: MicroOndesIcon,
}

// Renvoie le composant icône pour une clé donnée, avec une flamme
// générique en repli si la clé n'est pas reconnue.
export function getCookingIcon(key) {
  return ICONS[key] || FlameIcon
}

export const COOKING_MODES = [
  { key: 'four', label: 'Four' },
  { key: 'poele', label: 'Poêle' },
  { key: 'airfryer', label: 'Airfryer' },
  { key: 'friteuse', label: 'Friteuse' },
  { key: 'micro_ondes', label: 'Micro-ondes' },
]
