import { useState, useEffect } from 'react'
import { PriceModeProvider } from './context/PriceModeContext'
import { CartProvider } from './context/CartContext'
import { ConseilProvider } from './context/ConseilContext'
import ConseilAssistant from './components/ConseilAssistant'
import { useCategories } from './hooks/useCategories'
import { useProducts } from './hooks/useProducts'
import { useSuppliers } from './hooks/useSuppliers'
import { getSupplierLogo } from './lib/suppliers'
import { isPromoActive, isDestockage } from './lib/pricing'
import Header from './components/Header'
import Hero from './components/Hero'
import ProductCard from './components/ProductCard'
import AdminPage from './pages/AdminPage'
import AdminGate from './components/AdminGate'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import LegalPage from './pages/LegalPage'
import Footer from './components/Footer'
import Breadcrumb from './components/Breadcrumb'
import { mentionsLegales, cgv, cgu, confidentialite } from './data/legalContent'
import MonComptePage from './pages/MonComptePage'
import MaintenancePage from './pages/MaintenancePage'
import ParrainagePage from './pages/ParrainagePage'
import RouePage from './pages/RouePage'
import { useSiteSettings } from './hooks/useSiteSettings'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'
import { pageEquivalente } from './lib/anciennesAdresses'
import { lirePage, depuisAncienLien, slug, urlRayon } from './lib/adresses'
import { aller, ecouterPages, interceptionLiens } from './lib/navigation'
import { useSeo } from './lib/seo'

function Shop({ rayon, sousRayon, searchQuery, promoOnly, destockageOnly, showFullCatalog, petitsFormatsOnly }) {
  const { products, loading: produitsEnCours, error } = useProducts({ leger: true })
  const { categories, subcategoriesByCategory, loading: rayonsEnCours } = useCategories()
  // Adresse /rayon/viandes/boeuf → noms réels « Viandes » / « Boeuf ».
  const activeCategory = rayon ? categories.find((c) => slug(c) === rayon) || null : null
  const activeSubcategory =
    activeCategory && sousRayon
      ? (subcategoriesByCategory[activeCategory] || []).find((s) => slug(s) === sousRayon) || null
      : null
  const rayonInconnu = !!rayon && !rayonsEnCours && (!activeCategory || (!!sousRayon && !activeSubcategory))
  const loading = produitsEnCours || (!!rayon && rayonsEnCours)
  const { suppliers } = useSuppliers()

  const publishedProducts = products.filter((p) => p.actif !== false)

  const isExclusiveRetrait = (p) => {
    if (p.variantes && p.variantes.length > 0) {
      return p.variantes.some((v) => v.dispo_retrait !== false && v.dispo_livraison === false)
    }
    return p.dispo_retrait !== false && p.dispo_livraison === false
  }

  let visibleProducts = publishedProducts
  let title = 'Tout le catalogue'
  const isHomepage =
    !promoOnly && !destockageOnly && !searchQuery && !rayon && !showFullCatalog && !petitsFormatsOnly

  if (promoOnly) {
    visibleProducts = publishedProducts.filter(isPromoActive)
    title = 'Promotions'
  } else if (destockageOnly) {
    visibleProducts = publishedProducts.filter(isDestockage)
    title = 'Déstockage'
  } else if (petitsFormatsOnly) {
    visibleProducts = publishedProducts.filter(isExclusiveRetrait)
    title = 'Petits formats — exclusif retrait'
  } else if (searchQuery) {
    const q = searchQuery.toLowerCase()
    visibleProducts = publishedProducts.filter((p) => p.nom.toLowerCase().includes(q))
    title = `Résultats pour « ${searchQuery} »`
  } else if (rayonInconnu) {
    visibleProducts = []
    title = 'Rayon introuvable'
  } else if (activeCategory) {
    visibleProducts = publishedProducts.filter((p) => p.categorie === activeCategory)
    title = activeCategory
    if (activeSubcategory) {
      visibleProducts = visibleProducts.filter(
        (p) => p.sous_categorie === activeSubcategory
      )
      title = `${activeCategory} — ${activeSubcategory}`
    }
  } else if (isHomepage) {
    visibleProducts = publishedProducts.filter((p) => p.mis_en_avant)
    title = 'Notre sélection'
  }

  const subcategoryOptions =
    activeCategory && !promoOnly ? subcategoriesByCategory[activeCategory] || [] : []

  // Ce que Google affiche pour cette page.
  const lieu = 'livrés autour de Landerneau ou à retirer au dépôt de Plouédern (Finistère)'
  useSeo(
    isHomepage
      ? { chemin: '/' }
      : searchQuery
        ? { titre: title, indexer: false }
        : promoOnly
          ? { titre: 'Promotions sur les surgelés', description: `Les promotions du moment sur nos produits surgelés, ${lieu}.` }
          : destockageOnly
            ? { titre: 'Déstockage', description: `Produits surgelés en déstockage à prix réduit, ${lieu}.` }
            : petitsFormatsOnly
              ? { titre: 'Petits formats', description: 'Petits formats de surgelés, exclusivement en retrait au dépôt de Plouédern.' }
              : showFullCatalog
                ? { titre: 'Tout le catalogue', description: `Tout le catalogue Bontin : plus de 250 produits surgelés, ${lieu}.` }
                : activeCategory
                  ? {
                      titre: activeSubcategory ? `Surgelés : ${activeSubcategory} (${activeCategory})` : `Surgelés : ${activeCategory}`,
                      description: `${activeSubcategory || activeCategory} : nos produits surgelés, ${lieu}.`,
                      chemin: urlRayon(activeCategory, activeSubcategory),
                    }
                  : { titre: title, indexer: !rayonInconnu }
  )

  return (
    <>
      <Header activeCategory={destockageOnly ? 'Déstockage' : activeCategory} />
      {isHomepage && <Hero />}

      <main className="px-5 py-8 max-w-6xl mx-auto">
        {!isHomepage && !searchQuery && (
          <Breadcrumb
            items={[
              { label: 'Accueil', href: '/' },
              ...(promoOnly
                ? [{ label: 'Promotions' }]
                : destockageOnly
                  ? [{ label: 'Déstockage' }]
                : petitsFormatsOnly
                  ? [{ label: 'Petits formats' }]
                  : showFullCatalog
                  ? [{ label: 'Tout le catalogue' }]
                  : activeSubcategory
                    ? [
                        { label: activeCategory, href: urlRayon(activeCategory) },
                        { label: activeSubcategory },
                      ]
                    : [{ label: activeCategory || 'Rayon introuvable' }]),
            ]}
          />
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          {isHomepage && (
            <a
              href="/catalogue"
              className="font-tag text-xs uppercase font-semibold text-forest hover:underline"
            >
              Voir tout le catalogue →
            </a>
          )}
        </div>

        {activeCategory && subcategoryOptions.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            <a
              href={urlRayon(activeCategory)}
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
                href={urlRayon(activeCategory, sub)}
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

        {!loading && !error && visibleProducts.length === 0 && isHomepage && (
          <p className="font-body text-sm text-muted">
            Aucun produit mis en avant pour l'instant.{' '}
            <a href="/catalogue" className="underline">
              Voir tout le catalogue
            </a>
            .
          </p>
        )}

        {!loading && !error && visibleProducts.length === 0 && !isHomepage && (
          <p className="font-body text-sm text-muted">
            {petitsFormatsOnly
              ? "Aucun format exclusif retrait pour l'instant."
              : 'Aucun produit trouvé.'}
          </p>
        )}

        {!loading && !error && visibleProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                supplierLogo={getSupplierLogo(suppliers, product.fournisseur)}
                prioritaire={i < 4}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

// Ancien lien en « # » (avant le 28/10/2026) : on le remplace tout de suite par la nouvelle adresse.
function adresseInitiale() {
  const nouvelle = depuisAncienLien(window.location.hash)
  if (nouvelle) window.history.replaceState(null, '', nouvelle)
  return window.location.pathname
}

function App() {
  const [chemin, setChemin] = useState(adresseInitiale)
  const { settings, loading: reglagesEnCours, rafraichir } = useSiteSettings()
  const { chargement: connexionEnCours, estAdmin } = useAuth()
  const page = lirePage(chemin)

  useEffect(() => {
    const changement = () => {
      const nouvelle = depuisAncienLien(window.location.hash)
      if (nouvelle) window.history.replaceState(null, '', nouvelle)
      setChemin(window.location.pathname)
      // Relit les réglages à chaque page : la mise en maintenance (ou sa levée) s'applique
      // sans que le visiteur ait à recharger.
      rafraichir()
    }
    const arreter = ecouterPages(changement)
    window.addEventListener('hashchange', changement)
    document.addEventListener('click', interceptionLiens)
    return () => {
      arreter()
      window.removeEventListener('hashchange', changement)
      document.removeEventListener('click', interceptionLiens)
    }
  }, [rafraichir])

  // Adresse inconnue : sans doute une ancienne page du site PrestaShop (/pizzas/30-pizza-chorizo.html…).
  // On la remplace par la page équivalente du nouveau site (le serveur IONOS le fait déjà pour les
  // anciennes adresses connues ; ceci couvre les autres et la préversion Vercel).
  const inconnue = page.type === 'inconnue'
  useEffect(() => {
    if (!inconnue) return
    let annule = false
    supabase
      .from('produits')
      .select('id, nom, actif')
      .then(({ data }) => {
        if (!annule) aller(pageEquivalente(window.location.pathname, window.location.search, data || []), { remplacer: true })
      })
    return () => {
      annule = true
    }
  }, [inconnue, chemin])

  // L'admin reste accessible en maintenance : c'est par là qu'on se connecte et qu'on la lève.
  // Roue de la carte privilège : essai réservé à l'admin (même connexion).
  if (page.type === 'roue') {
    return (
      <AdminGate>
        <RouePage />
      </AdminGate>
    )
  }

  if (page.type === 'admin') {
    return (
      <AdminGate>
        <AdminPage />
      </AdminGate>
    )
  }

  // On attend les réglages pour ne pas montrer la boutique un instant avant la page de maintenance.
  // (Si les réglages sont illisibles, on affiche le site normalement plutôt qu'une page vide.)
  if (settings === null && reglagesEnCours) return <div className="min-h-screen bg-stone" />
  if (settings?.en_maintenance && !estAdmin) {
    if (connexionEnCours) return <div className="min-h-screen bg-stone" />
    return <MaintenancePage settings={settings} />
  }

  return (
    <PriceModeProvider>
      <CartProvider>
        <ConseilProvider>
          {settings?.en_maintenance && (
            <a
              href="/admin"
              className="block bg-rust text-paper text-center font-tag text-xs uppercase font-semibold tracking-wide px-4 py-2"
            >
              Site en maintenance : les visiteurs voient la page « On revient très vite ». Pour la lever : admin → Réglages du site
            </a>
          )}
          {page.type === 'mentions-legales' ? (
            <LegalPage title="Mentions légales" content={mentionsLegales} />
          ) : page.type === 'confidentialite' ? (
            <LegalPage title="Politique de confidentialité" content={confidentialite} />
          ) : page.type === 'parrainage' ? (
            <ParrainagePage codeRecu={page.code} />
          ) : page.type === 'mon-compte' ? (
            <MonComptePage />
          ) : page.type === 'cgv' ? (
            <LegalPage title="Conditions générales de vente" content={cgv} />
          ) : page.type === 'cgu' ? (
            <LegalPage title="Conditions générales d'utilisation" content={cgu} />
          ) : page.type === 'produit' ? (
            <ProductDetailPage key={page.id8} id={page.id8} />
          ) : page.type === 'panier' ? (
            <CartPage />
          ) : inconnue ? (
            <div className="min-h-screen bg-stone" />
          ) : (
            <Shop
              rayon={page.type === 'rayon' ? page.categorie : null}
              sousRayon={page.type === 'rayon' ? page.sousCategorie : null}
              searchQuery={page.type === 'recherche' ? page.texte : null}
              promoOnly={page.type === 'promotions'}
              destockageOnly={page.type === 'destockage'}
              showFullCatalog={page.type === 'catalogue'}
              petitsFormatsOnly={page.type === 'petits-formats'}
            />
          )}
          <ConseilAssistant />
        </ConseilProvider>
      </CartProvider>
    </PriceModeProvider>
  )
}

export default App
