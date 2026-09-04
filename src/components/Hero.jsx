import { useSiteSettings } from '../hooks/useSiteSettings'
import { useProducts } from '../hooks/useProducts'
import CroppableImage from './CroppableImage'

export default function Hero() {
  const { settings } = useSiteSettings()
  const { products } = useProducts()
  const promoCount = products.filter((p) => p.actif !== false && p.en_promo).length

  return (
    <section className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] border-b border-ink/15">
      <div className="bg-forest text-paper px-5 md:px-8 py-8 md:py-10 flex flex-col justify-center">
        <span className="font-tag text-xs uppercase tracking-widest text-stone/80 mb-2">
          {settings?.hero_badge ?? '250 références'}
        </span>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.95] mb-4">
          {settings?.hero_titre ?? 'Le surgelé, en livraison ou en retrait'}
        </h1>
        <p className="font-body text-sm text-stone/90 max-w-md mb-6">
          {settings?.hero_sous_titre ??
            `Commandez chez vous, récupérez en point de retrait et économisez ${settings?.remise_retrait ?? 10}% sur chaque commande retirée sur place.`}
        </p>
        <a
          href={promoCount > 0 ? '#promo' : '#catalogue'}
          className="w-fit bg-rust text-paper font-tag text-sm font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-rust/90 transition-colors"
        >
          {promoCount > 0 ? 'Voir les promos' : 'Voir le catalogue'}
        </a>
      </div>
      <div className="relative bg-stone flex items-center justify-center min-h-[180px] md:min-h-[220px] overflow-hidden">
        {settings?.hero_url ? (
          <CroppableImage
            src={settings.hero_url}
            alt="Elorn Gel"
            zoom={settings.hero_zoom ?? 1}
            posX={settings.hero_pos_x ?? 50}
            posY={settings.hero_pos_y ?? 50}
          />
        ) : (
          <span className="font-tag text-xs uppercase text-muted">
            Photo produit / vitrine
          </span>
        )}
      </div>
    </section>
  )
}
