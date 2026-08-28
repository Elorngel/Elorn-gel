import { usePriceMode } from '../context/PriceModeContext'
import { categories } from '../data/products'

export default function Header({ activeCategory, onSelectCategory }) {
  const { mode, setMode } = usePriceMode()

  return (
    <header className="bg-paper border-b border-ink/15 sticky top-0 z-10">
      <div className="bg-ink text-stone text-[11px] font-tag px-5 py-1.5 flex justify-between">
        <span>Retrait gratuit sous 48h à Ploudiry</span>
        <div className="flex gap-4">
          <span>02 98 XX XX XX</span>
          <a href="#admin" className="text-stone/60 hover:text-stone">
            Administration
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 px-5 py-3 flex-wrap">
        <div className="font-display text-3xl tracking-wide text-forest">
          ELORN GEL
        </div>

        <nav className="flex gap-5 text-sm flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`font-body pb-0.5 border-b-2 transition-colors ${
                activeCategory === cat
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-ink hover:border-ink/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        <div className="flex border border-ink/40 font-tag text-xs font-semibold uppercase">
          <button
            onClick={() => setMode('livraison')}
            className={`px-3 py-1.5 transition-colors ${
              mode === 'livraison' ? 'bg-ink text-paper' : 'text-ink'
            }`}
          >
            Livraison
          </button>
          <button
            onClick={() => setMode('retrait')}
            className={`px-3 py-1.5 border-l border-ink/40 transition-colors ${
              mode === 'retrait' ? 'bg-ink text-paper' : 'text-ink'
            }`}
          >
            Retrait -20%
          </button>
        </div>
      </div>
    </header>
  )
}
