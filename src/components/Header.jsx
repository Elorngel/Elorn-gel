import { useState } from 'react'
import { usePriceMode } from '../context/PriceModeContext'
import { useCart } from '../context/CartContext'
import { categories } from '../data/products'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function Header({ activeCategory }) {
  const { mode, setMode } = usePriceMode()
  const { settings } = useSiteSettings()
  const { itemCount } = useCart()
  const [searchText, setSearchText] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const query = searchText.trim()
    if (query) {
      window.location.hash = `#recherche/${encodeURIComponent(query)}`
    }
  }

  return (
    <header className="bg-paper border-b border-ink/15 sticky top-0 z-10">
      <div className="bg-ink text-stone text-[11px] font-tag px-5 py-1.5 flex justify-between">
        <span>Retrait gratuit sous 24h à Plouédern</span>
        <div className="flex gap-4">
          <span>02 98 20 50 43</span>
          <a href="#admin" className="text-stone/60 hover:text-stone">
            Administration
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 px-5 py-3 flex-wrap">
        <a href="#" className="block h-10 relative">
          <img
            src={settings?.logo_url || '/logo.png'}
            alt="Elorn Gel"
            className="h-10 w-auto"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <span
            className="font-display text-3xl tracking-wide text-forest absolute inset-0"
            style={{ display: 'none' }}
          >
            BONTIN
          </span>
        </a>

        <nav className="flex gap-5 text-sm flex-wrap">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`#categorie/${encodeURIComponent(cat)}`}
              className={`font-body pb-0.5 border-b-2 transition-colors ${
                activeCategory === cat
                  ? 'border-forest text-forest font-semibold'
                  : 'border-transparent text-ink hover:border-ink/30'
              }`}
            >
              {cat}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex border border-ink/40">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-40 px-2.5 py-1.5 text-sm font-body bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="px-2.5 border-l border-ink/40 font-tag text-xs uppercase hover:bg-stone"
              aria-label="Rechercher"
            >
              OK
            </button>
          </form>

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
              Retrait -10%
            </button>
          </div>

          <a
            href="#panier"
            className="relative border border-ink/40 px-3 py-1.5 font-tag text-xs uppercase font-semibold hover:bg-stone"
          >
            Panier
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rust text-paper text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  )
}
