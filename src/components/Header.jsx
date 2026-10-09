import { useState, useRef, useEffect, useMemo } from 'react'
import { usePriceMode } from '../context/PriceModeContext'
import { useCart } from '../context/CartContext'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../lib/supabaseClient'
import SocialIcon from './SocialIcon'
import { isAdminAuthenticated } from './AdminGate'
import { DEFAULT_TELEPHONE, DEFAULT_BANDEAU } from '../lib/siteDefaults'
import { isDestockage } from '../lib/pricing'

const MIN_CHARS_SUGGESTIONS = 3
const MAX_SUGGESTIONS = 8

function SearchSuggestions({ suggestions, onSelect }) {
  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-paper border border-ink/20 shadow-sm z-30 py-1">
      {suggestions.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className="w-full text-left px-3 py-2 hover:bg-stone flex items-baseline justify-between gap-2"
        >
          <span className="font-body text-sm text-ink truncate">{p.nom}</span>
          {p.categorie && (
            <span className="font-tag text-[10px] uppercase text-muted shrink-0">
              {p.categorie}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function Header({ activeCategory }) {
  const { mode, setMode, discountPercent } = usePriceMode()
  const { settings } = useSiteSettings()
  const { categories, subcategoriesByCategory } = useCategories()
  const { itemCount } = useCart()
  const [searchText, setSearchText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openCategory, setOpenCategory] = useState(null)
  const [openMobileCategory, setOpenMobileCategory] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchProducts, setSearchProducts] = useState([])
  // Le lien vers l'admin n'est visible que pour une personne connectée en mode admin.
  const [estAdmin] = useState(() => isAdminAuthenticated())
  const navRef = useRef(null)
  const searchRef = useRef(null)
  const mobileSearchRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenCategory(null)
      }
      if (
        searchRef.current && !searchRef.current.contains(e.target) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Liste légère (nom + catégorie seulement) pour les suggestions de recherche,
  // chargée une fois — pas besoin des variantes/prix ici.
  useEffect(() => {
    supabase
      .from('produits')
      .select('id, nom, categorie, en_destockage, prix_destockage, prix_livraison')
      .eq('actif', true)
      .order('nom', { ascending: true })
      .then(({ data }) => setSearchProducts(data || []))
  }, [])

  const hasDestockage = useMemo(() => searchProducts.some(isDestockage), [searchProducts])

  const suggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (q.length < MIN_CHARS_SUGGESTIONS) return []
    return searchProducts
      .filter((p) => p.nom.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS)
  }, [searchText, searchProducts])

  const goToProduct = (id) => {
    setShowSuggestions(false)
    setMenuOpen(false)
    setSearchText('')
    window.location.hash = `#produit/${id}`
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = searchText.trim()
    if (query) {
      setShowSuggestions(false)
      setMenuOpen(false)
      window.location.hash = `#recherche/${encodeURIComponent(query)}`
    }
  }

  return (
    <header className="bg-paper border-b border-ink/15 sticky top-0 z-20">
      <div className="bg-ink text-stone text-[11px] font-tag px-4 md:px-5 py-1.5 flex justify-between">
        <span className="truncate">
          {settings ? settings.bandeau_haut ?? DEFAULT_BANDEAU : ''}
        </span>
        <div className="flex items-center gap-4 shrink-0 ml-2">
          <div className="flex items-center gap-3">
            <SocialIcon name="Facebook" url={settings?.lien_facebook} />
            <SocialIcon name="Instagram" url={settings?.lien_instagram} />
          </div>
          <a
            href={`tel:${(settings?.contact_telephone || DEFAULT_TELEPHONE).replace(/\s/g, '')}`}
            className="hidden sm:inline"
          >
            {settings?.contact_telephone || DEFAULT_TELEPHONE}
          </a>
          {estAdmin && (
            <a href="#admin" className="text-stone/60 hover:text-stone">
              Administration
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-3">
        <a href="#" className="block h-9 md:h-10 relative shrink-0">
          <img
            src={settings?.logo_url || '/logo.png'}
            alt="Bontin"
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
            BONTIN
          </span>
        </a>

        {/* Bloc recherche + toggle + panier : visible seulement à partir de md */}
        <div className="hidden md:flex items-center gap-3">
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearch} className="flex border border-ink/40">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Rechercher un produit…"
                className="w-56 lg:w-64 px-2.5 py-1.5 text-sm font-body bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 border-l border-ink/40 font-tag text-xs uppercase hover:bg-stone shrink-0"
                aria-label="Rechercher"
              >
                OK
              </button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <SearchSuggestions suggestions={suggestions} onSelect={goToProduct} />
            )}
          </div>

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
              Retrait{discountPercent > 0 ? ` -${discountPercent}%` : ''}
            </button>
          </div>

          {mode === 'retrait' && (
            <a
              href="#petits-formats"
              className="border border-forest bg-forest/10 text-forest px-3 py-1.5 font-tag text-xs uppercase font-semibold hover:bg-forest hover:text-paper transition-colors"
            >
              Petits formats
            </a>
          )}

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
        {hasDestockage && (
          <a
            href="#destockage"
            className={`font-body pb-0.5 border-b-2 transition-colors ${
              activeCategory === 'Déstockage'
                ? 'border-rust text-rust font-semibold'
                : 'border-transparent text-rust font-semibold hover:border-rust/40'
            }`}
          >
            Déstockage
          </a>
        )}
      </nav>

      {/* Panneau mobile : catégories, recherche, mode livraison/retrait */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink/15 bg-paper px-4 py-4">
          <div ref={mobileSearchRef} className="relative mb-4">
            <form onSubmit={handleSearch} className="flex border border-ink/40">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
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
            {showSuggestions && suggestions.length > 0 && (
              <SearchSuggestions suggestions={suggestions} onSelect={goToProduct} />
            )}
          </div>

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
              Retrait{discountPercent > 0 ? ` -${discountPercent}%` : ''}
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
            {hasDestockage && (
              <div className="py-3">
                <a
                  href="#destockage"
                  onClick={() => setMenuOpen(false)}
                  className="font-body text-sm text-rust font-semibold"
                >
                  Déstockage
                </a>
              </div>
            )}
          </nav>

          {mode === 'retrait' && (
            <a
              href="#petits-formats"
              onClick={() => setMenuOpen(false)}
              className="block mt-4 font-tag text-xs uppercase font-semibold text-forest"
            >
              🎁 Petits formats — exclusif retrait
            </a>
          )}

          <a
            href={`tel:${(settings?.contact_telephone || DEFAULT_TELEPHONE).replace(/\s/g, '')}`}
            className="block mt-4 font-tag text-xs uppercase text-muted"
          >
            Appeler le dépôt · {settings?.contact_telephone || DEFAULT_TELEPHONE}
          </a>
        </div>
      )}
    </header>
  )
}
