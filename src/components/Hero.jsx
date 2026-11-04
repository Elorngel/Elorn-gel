import { useEffect, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useProducts } from '../hooks/useProducts'
import { usePriceMode } from '../context/PriceModeContext'
import CroppableImage from './CroppableImage'
import { isPromoActive } from '../lib/pricing'

// Diaporama de la bannière : la photo vitrine (réglée dans l'admin), puis les
// images ci-dessous (fichiers du dossier public/hero). Pour changer, ajouter ou
// retirer une image, modifier cette liste ; 'contain' montre l'image entière
// (fond pierre), 'cover' remplit tout le cadre.
const SLIDES_FIXES = [
  { src: '/hero/zone-livraison.jpg', alt: 'Carte de la zone de livraison BONTIN autour de Plouédern', fit: 'contain' },
  { src: '/hero/cassoulet.jpg', alt: 'Cassoulet de canard BONTIN', fit: 'cover' },
]
const DELAI_DIAPO_MS = 4000

export default function Hero() {
  const { settings } = useSiteSettings()
  const { products } = useProducts({ leger: true })
  const { mode, setMode } = usePriceMode()
  const promoCount = products.filter((p) => p.actif !== false && isPromoActive(p)).length

  // Diapositive 0 = photo vitrine (si elle existe), puis les images fixes.
  const nbDiapos = (settings?.hero_url ? 1 : 0) + SLIDES_FIXES.length
  const [diapo, setDiapo] = useState(0)
  const [enPause, setEnPause] = useState(false)
  const mouvementReduit =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (enPause || mouvementReduit || nbDiapos < 2) return
    const t = setInterval(() => setDiapo((d) => (d + 1) % nbDiapos), DELAI_DIAPO_MS)
    return () => clearInterval(t)
  }, [enPause, mouvementReduit, nbDiapos])

  return (
    <>
    <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] border-b border-ink/15">
      <div className="bg-forest text-paper px-5 md:px-8 py-8 flex flex-col justify-center">
        <span className="font-tag text-xs uppercase tracking-widest text-stone/80 mb-2">
          {settings ? settings.hero_badge ?? '250 références' : ''}
        </span>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl leading-[0.95] mb-4">
          {settings ? settings.hero_titre ?? 'Le surgelé, en livraison ou en retrait' : ''}
        </h1>
        <p className="font-body text-sm text-stone/90 max-w-md mb-6">
          {settings
            ? settings.hero_sous_titre ??
              `Commandez chez vous, récupérez en point de retrait et économisez ${settings.remise_retrait ?? 10}% sur chaque commande retirée sur place.`
            : ''}
        </p>
        <a
          href={promoCount > 0 ? '/promotions' : '/catalogue'}
          className="w-fit bg-rust text-paper font-tag text-sm font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-rust/90 transition-colors"
        >
          {promoCount > 0 ? 'Voir les promos' : 'Voir le catalogue'}
        </a>
      </div>
      {/* Format 16:9 fixe : le cadre de réglage de la photo dans l'admin a le même format.
          Diaporama automatique (4 s), en pause quand la souris est dessus. */}
      <div
        className="relative bg-stone aspect-video lg:self-stretch overflow-hidden"
        onMouseEnter={() => setEnPause(true)}
        onMouseLeave={() => setEnPause(false)}
      >
        {settings?.hero_url ? (
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${diapo === 0 ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={diapo !== 0}
          >
            <CroppableImage
              src={settings.hero_url}
              alt="Bontin"
              loading="eager"
              zoom={settings.hero_zoom ?? 1}
              posX={settings.hero_pos_x ?? 50}
              posY={settings.hero_pos_y ?? 50}
            />
          </div>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-tag text-xs uppercase text-muted">
            Photo produit / vitrine
          </span>
        )}
        {SLIDES_FIXES.map((sl, i) => {
          const index = i + (settings?.hero_url ? 1 : 0)
          return (
            <img
              key={sl.src}
              src={sl.src}
              alt={sl.alt}
              loading="eager"
              decoding="async"
              aria-hidden={diapo !== index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
                sl.fit === 'contain' ? 'object-contain' : 'object-cover'
              } ${diapo === index ? 'opacity-100' : 'opacity-0'}`}
            />
          )
        })}
        {nbDiapos > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {Array.from({ length: nbDiapos }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDiapo(i)}
                aria-label={`Afficher l'image ${i + 1} sur ${nbDiapos}`}
                aria-current={diapo === i}
                className={`h-2.5 w-2.5 border border-paper/80 shadow-sm transition-colors ${
                  diapo === i ? 'bg-forest' : 'bg-paper/70 hover:bg-paper'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>

    {mode === 'livraison' && (
      <div className="bg-stone border-b border-ink/15 px-5 py-3 flex items-center justify-center gap-3 flex-wrap text-center">
        <p className="font-body text-sm text-ink">
          📦 Vous commandez régulièrement ? En mode <strong>Retrait</strong>, retrouvez
          des conditionnements plus petits, adaptés aux commandes fréquentes.
        </p>
        <button
          onClick={() => setMode('retrait')}
          className="font-tag text-xs uppercase font-semibold text-forest hover:underline shrink-0"
        >
          Passer en Retrait →
        </button>
      </div>
    )}
    </>
  )
}
