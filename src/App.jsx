import { useState, useEffect } from 'react'
import { PriceModeProvider } from './context/PriceModeContext'
import { categories } from './data/products'
import { useProducts } from './hooks/useProducts'
import Header from './components/Header'
import Hero from './components/Hero'
import ProductCard from './components/ProductCard'
import AdminPage from './pages/AdminPage'

function Shop() {
  const [activeCategory, setActiveCategory] = useState(null)
  const { products, loading, error } = useProducts()

  const visibleProducts = activeCategory
    ? products.filter((p) => p.categorie === activeCategory)
    : products

  return (
    <PriceModeProvider>
      <Header activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
      <Hero />

      <main className="px-5 py-8 max-w-6xl mx-auto">
        <h2 className="font-display text-2xl text-ink mb-4">
          {activeCategory || 'Tout le catalogue'}
        </h2>

        {loading && (
          <p className="font-body text-sm text-muted">Chargement du catalogue…</p>
        )}

        {error && (
          <p className="font-body text-sm text-rust">
            Connexion à la base impossible : {error}. Vérifie ton fichier .env.local.
          </p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </PriceModeProvider>
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

  return <Shop />
}

export default App
