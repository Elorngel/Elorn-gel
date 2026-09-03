import { useState, useRef, useEffect } from 'react'
import { usePriceMode } from '../context/PriceModeContext'
import { useCart } from '../context/CartContext'
import { categories, subcategoriesByCategory } from '../data/products'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function Header({ activeCategory }) {
  const { mode, setMode, discountPercent } = usePriceMode()
  const { settings } = useSiteSettings()
  const { itemCount } = useCart()
  const [searchText, setSearchText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState(null)
  const [openMobileCategory, setOpenMobileCategory] = useState(null)
  const navRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenCategory(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const query = searchText.trim()
    if (query) {
      setMenuOpen(false)
      window.location.hash = `#recherche/${encodeURIComponent(query)}`
    }
  }

  return (
    <header className="bg-paper border-b border-ink/15 sticky top-0 z-20">
      <div className="bg-ink text-stone text-[11px] font-tag px-4 md:px-5 py-1.5 flex justify-between">
        <span className="truncate">Retrait gratuit sous 24h à Plouédern</span>
        <div className="flex gap-4 shrink-0 ml-2">
          <a href="tel:0298205043" className="hidden sm:inline">
            02 98 20 50 43
          </a>
          <a href="#admin" className="text-stone/60 hover:text-stone">
            Administration
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-3">
        <a href="#" className="block h-9 md:h-10 relative shrink-0">
          <img
            src={settings?.logo_url || '/logo.png'}
            alt="Elorn Gel"
            className="h-9 md:h-10 w-auto"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <span
            className="font-display text-2xl md:text-3xl tracking-wide text-forest absolute inset-0"
            style={{ display: 'none' }}
          >
            ELORN GEL
          </span>
        </a>

        {/* Bloc recherche + toggle + panier : visible seulement à partir de md */}
        <div className="hidden md:flex items-center gap-3">
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
              Retrait -{discountPercent}%
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

        {/* Panier + burger : visibles seulement en dessous de md */}
        <div className="flex md:hidden items-center gap-3 shrink-0">
          <a href="#panier" className="relative" aria-label="Voir le panier">
            <span className="font-tag text-xs uppercase font-semibold border border-ink/40 px-2.5 py-1.5 block">
              Panier
            </span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rust text-paper text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </a>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 border border-ink/40"
          >
            <span
              className={`block w-5 h-0.5 bg-ink transition-transform ${
                menuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-ink transition-opacity ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-ink transition-transform ${
                menuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation catégories avec sous-menus déroulants : à partir de md */}
      <nav ref={navRef} className="hidden md:flex gap-5 text-sm px-4 md:px-5 pb-3 flex-wrap">
        {categories.map((cat) => {
          const subcats = subcategoriesByCategory[cat] || []
          const isOpen = openCategory === cat

          return (
            <div key={cat} className="relative">
              <button
                onClick={() => setOpenCategory(isOpen ? null : cat)}
                className={`flex items-center gap-1 font-body pb-0.5 border-b-2 transition-colors ${
                  activeCategory === cat
                    ? 'border-forest text-forest font-semibold'
                    : 'border-transparent text-ink hover:border-ink/30'
                }`}
              >
                {cat}
                {subcats.length > 0 && (
                  <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                )}
              </button>

              {isOpen && subcats.length > 0 && (
                <div className="absolute left-0 top-full mt-1 bg-paper border border-ink/20 shadow-sm z-30 min-w-[180px] py-1">
                  <a
                    href={`#categorie/${encodeURIComponent(cat)}`}
                    onClick={() => setOpenCategory(null)}
                    className="block px-3 py-2 font-tag text-xs uppercase font-semibold text-forest hover:bg-stone border-b border-ink/10"
                  >
                    Tout {cat.toLowerCase()}
                  </a>
                  {subcats.map((sub) => (
                    <a
                      key={sub}
                      href={`#categorie/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`}
                      onClick={() => setOpenCategory(null)}
                      className="block px-3 py-2 font-body text-sm text-ink hover:bg-stone"
                    >
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Panneau mobile : catégories, recherche, mode livraison/retrait */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink/15 bg-paper px-4 py-4">
          <form onSubmit={handleSearch} className="flex border border-ink/40 mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher un produit…"
              className="flex-1 min-w-0 px-2.5 py-2 text-sm font-body bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 border-l border-ink/40 font-tag text-xs uppercase shrink-0"
            >
              OK
            </button>
          </form>

          <div className="flex border border-ink/40 font-tag text-xs font-semibold uppercase mb-4">
            <button
              onClick={() => setMode('livraison')}
              className={`flex-1 py-2 transition-colors ${
                mode === 'livraison' ? 'bg-ink text-paper' : 'text-ink'
              }`}
            >
              Livraison
            </button>
            <button
              onClick={() => setMode('retrait')}
              className={`flex-1 py-2 border-l border-ink/40 transition-colors ${
                mode === 'retrait' ? 'bg-ink text-paper' : 'text-ink'
              }`}
            >
              Retrait -{discountPercent}%
            </button>
          </div>

          <nav className="flex flex-col divide-y divide-ink/10 border-t border-ink/10">
            {categories.map((cat) => {
              const subcats = subcategoriesByCategory[cat] || []
              const isOpen = openMobileCategory === cat

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between py-3">
                    <a
                      href={`#categorie/${encodeURIComponent(cat)}`}
                      onClick={() => setMenuOpen(false)}
                      className={`font-body text-sm ${
                        activeCategory === cat ? 'text-forest font-semibold' : 'text-ink'
                      }`}
                    >
                      {cat}
                    </a>
                    {subcats.length > 0 && (
                      <button
                        onClick={() => setOpenMobileCategory(isOpen ? null : cat)}
                        aria-label="Sous-catégories"
                        className="w-8 h-8 flex items-center justify-center text-muted"
                      >
                        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
                      </button>
                    )}
                  </div>
                  {isOpen && subcats.length > 0 && (
                    <div className="pb-2 pl-3 flex flex-col gap-2">
                      {subcats.map((sub) => (
                        <a
                          key={sub}
                          href={`#categorie/${encodeURIComponent(cat)}/${encodeURIComponent(sub)}`}
                          onClick={() => setMenuOpen(false)}
                          className="font-tag text-xs uppercase text-muted hover:text-ink"
                        >
                          {sub}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <a
            href="tel:0298205043"
            className="block mt-4 font-tag text-xs uppercase text-muted"
          >
            Appeler le dépôt · 02 98 20 50 43
          </a>
        </div>
      )}
    </header>
  )
}
