import { useState, useEffect } from 'react'
import { PriceModeProvider } from './context/PriceModeContext'
import { subcategoriesByCategory } from './data/products'
import { useProducts } from './hooks/useProducts'
import Header from './components/Header'
import Hero from './components/Hero'
import ProductCard from './components/ProductCard'
import AdminPage from './pages/AdminPage'
import ProductDetailPage from './pages/ProductDetailPage'

function Shop({ activeCategory, activeSubcategory, searchQuery }) {
  const { products, loading, error } = useProducts()

  const publishedProducts = products.filter((p) => p.actif !== false)

  let visibleProducts = publishedProducts
  let title = 'Tout le catalogue'

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    visibleProducts = publishedProducts.filter((p) => p.nom.toLowerCase().includes(q))
    title = `Résultats pour « ${searchQuery} »`
  } else if (activeCategory) {
    visibleProducts = publishedProducts.filter((p) => p.categorie === activeCategory)
    title = activeCategory
    if (activeSubcategory) {
      visibleProducts = visibleProducts.filter(
        (p) => p.sous_categorie === activeSubcategory
      )
      title = `${activeCategory} — ${activeSubcategory}`
    }
  }

  const subcategoryOptions = activeCategory
    ? subcategoriesByCategory[activeCategory] || []
    : []

  return (
    <>
      <Header activeCategory={activeCategory} />
      {!searchQuery && <Hero />}

      <main className="px-5 py-8 max-w-6xl mx-auto">
        <h2 className="font-display text-2xl text-ink mb-3">{title}</h2>

        {activeCategory && subcategoryOptions.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            <a
              href={`#categorie/${encodeURIComponent(activeCategory)}`}
              className={`font-tag text-[11px] uppercase px-3 py-1.5 border ${
                !activeSubcategory
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/30 text-ink hover:border-ink'
              }`}
            >
              Tout
            </a>
            {subcategoryOptions.map((sub) => (
              <a
                key={sub}
                href={`#categorie/${encodeURIComponent(activeCategory)}/${encodeURIComponent(sub)}`}
                className={`font-tag text-[11px] uppercase px-3 py-1.5 border ${
                  activeSubcategory === sub
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/30 text-ink hover:border-ink'
                }`}
              >
                {sub}
              </a>
            ))}
          </div>
        )}

        {loading && (
          <p className="font-body text-sm text-muted">Chargement du catalogue…</p>
        )}

        {error && (
          <p className="font-body text-sm text-rust">
            Connexion à la base impossible : {error}. Vérifie ton fichier .env.local.
          </p>
        )}

        {!loading && !error && visibleProducts.length === 0 && (
          <p className="font-body text-sm text-muted">Aucun produit trouvé.</p>
        )}

        {!loading && !error && visibleProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function App() {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route === '#admin') {
    return <AdminPage />
  }

  const produitMatch = route.match(/^#produit\/(.+)$/)
  const categorieMatch = route.match(/^#categorie\/([^/]+)(?:\/(.+))?$/)
  const rechercheMatch = route.match(/^#recherche\/(.+)$/)

  const activeCategory = categorieMatch ? decodeURIComponent(categorieMatch[1]) : null
  const activeSubcategory =
    categorieMatch && categorieMatch[2] ? decodeURIComponent(categorieMatch[2]) : null
  const searchQuery = rechercheMatch ? decodeURIComponent(rechercheMatch[1]) : null

  return (
    <PriceModeProvider>
      {produitMatch ? (
        <ProductDetailPage id={produitMatch[1]} />
      ) : (
        <Shop
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          searchQuery={searchQuery}
        />
      )}
    </PriceModeProvider>
  )
}

export default App
