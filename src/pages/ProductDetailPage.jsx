import { useState } from 'react'
import { useProduct } from '../hooks/useProduct'
import { usePriceMode } from '../context/PriceModeContext'
import { useCart } from '../context/CartContext'
import CroppableImage from '../components/CroppableImage'
import ProductCard from '../components/ProductCard'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getBasePrice, getDefaultVariant, isProductAvailable, getAvailableVariants, getPricePerUnitLabel } from '../lib/pricing'

export default function ProductDetailPage({ id }) {
  const { product, related, loading, error } = useProduct(id)
  const { isPickup, getPickupPrice, discountPercent, setMode } = usePriceMode()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [justAdded, setJustAdded] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState(null)

  if (loading) {
    return (
      <div>
        <Header activeCategory={null} />
        <div className="p-8 font-body text-sm text-muted">Chargement…</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div>
        <Header activeCategory={null} />
        <div className="p-8 font-body text-sm text-rust">
          Produit introuvable.{' '}
          <a href="#" className="underline">
            Retour au catalogue
          </a>
        </div>
      </div>
    )
  }

  const hasVariants = product.variantes && product.variantes.length > 0
  const availableVariants = hasVariants ? getAvailableVariants(product, isPickup) : []
  const productAvailableNoVariants = !hasVariants && isProductAvailable(product, isPickup)
  const isAvailableInMode = hasVariants ? availableVariants.length > 0 : productAvailableNoVariants

  const selectedVariant = hasVariants
    ? availableVariants.find((v) => v.id === selectedVariantId) ||
      availableVariants.find((v) => v.est_defaut) ||
      availableVariants[0] ||
      null
    : null
  const referencePrice = selectedVariant ? selectedVariant.prix_livraison : product.prix_livraison
  const displayWeight = selectedVariant ? selectedVariant.poids : product.poids
  const basePrice = getBasePrice(product, referencePrice)
  const pickupPrice = getPickupPrice(basePrice)
  const displayPrice = isPickup ? pickupPrice : basePrice
  const tags = product.tags
    ? product.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-stone">
      <Header activeCategory={product.categorie} />
      <div className="max-w-5xl mx-auto px-5 py-6">
        <a href="#" className="font-tag text-xs uppercase text-muted hover:text-ink">
          ‹ Retour au catalogue
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="relative bg-paper border border-ink/15 overflow-hidden aspect-square">
            {product.photo_url ? (
              <CroppableImage
                src={product.photo_url}
                alt={product.nom}
                zoom={product.photo_zoom ?? 1}
                posX={product.photo_pos_x ?? 50}
                posY={product.photo_pos_y ?? 50}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-tag text-xs uppercase text-muted">
                Photo produit
              </span>
            )}

            {product.en_rupture && (
              <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                <span className="font-tag text-paper text-sm uppercase font-semibold tracking-wide border border-paper/60 px-4 py-2">
                  Bientôt de retour
                </span>
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-4xl text-ink leading-tight mb-2">
              {product.nom}
            </h1>
            {product.poids && !hasVariants && (
              <p className="font-tag text-sm text-muted mb-3">
                {displayWeight}
                {product.poids_variable && ' (poids selon arrivage)'}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-tag text-[11px] border border-ink/25 text-muted px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {hasVariants && availableVariants.length > 0 && (
              <div className="mb-4">
                <p className="font-tag text-xs uppercase text-muted mb-2">Conditionnement</p>
                <div className="flex gap-2 flex-wrap">
                  {availableVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`font-tag text-xs uppercase font-semibold px-3 py-2 border ${
                        selectedVariant?.id === v.id
                          ? 'border-ink bg-ink text-paper'
                          : 'border-ink/30 text-ink hover:border-ink'
                      }`}
                    >
                      {v.poids} — {v.prix_livraison.toFixed(2)} €
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isAvailableInMode ? (
              <div className="border-y border-ink/15 py-4 mb-4">
                <p className="font-body text-sm text-ink mb-2">
                  Ce produit n'est disponible qu'en {isPickup ? 'livraison' : 'retrait'}
                  {hasVariants && ' dans le conditionnement que tu recherches'}.
                </p>
                <button
                  onClick={() => setMode(isPickup ? 'livraison' : 'retrait')}
                  className="font-tag text-xs uppercase font-semibold text-forest underline"
                >
                  Voir en mode {isPickup ? 'livraison' : 'retrait'}
                </button>
              </div>
            ) : (
              <div className="border-y border-ink/15 py-4 mb-4">
                {getPricePerUnitLabel(product, basePrice) && (
                  <p className="font-tag text-xs text-muted mb-1">
                    {getPricePerUnitLabel(product, basePrice)}
                  </p>
                )}
                <div className="flex items-baseline gap-3 flex-wrap">
                  {product.en_promo && (
                    <span className="font-tag text-sm text-muted line-through">
                      {referencePrice.toFixed(2)} €
                    </span>
                  )}
                  {isPickup && discountPercent > 0 && (
                    <span className="font-tag text-sm text-muted line-through">
                      {basePrice.toFixed(2)} €
                    </span>
                  )}
                  <span
                    className={`font-display text-4xl ${
                      product.en_promo && !isPickup ? 'text-rust' : 'text-ink'
                    }`}
                  >
                    {displayPrice.toFixed(2)} €
                  </span>
                  {product.en_promo && (
                    <span className="font-tag text-xs uppercase font-semibold text-paper bg-ink px-2 py-1">
                      Promo -{product.taux_promo}%
                    </span>
                  )}
                  {isPickup && discountPercent > 0 && (
                    <span className="font-tag text-xs uppercase font-semibold text-forest">
                      Retrait -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {!product.en_rupture && isAvailableInMode ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center border border-ink/40">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 font-display text-lg hover:bg-stone"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-12 h-9 text-center font-body text-sm bg-transparent"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 font-display text-lg hover:bg-stone"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      addItem(product, quantity, selectedVariant)
                      setJustAdded(true)
                      setTimeout(() => setJustAdded(false), 1500)
                    }}
                    className={`flex-1 font-tag text-xs font-semibold uppercase tracking-wide py-2.5 transition-colors ${
                      justAdded
                        ? 'bg-forest text-paper'
                        : 'bg-ink text-paper hover:bg-forest'
                    }`}
                  >
                    {justAdded ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
                  </button>
                </div>
                <span className="inline-block font-tag text-[11px] uppercase font-semibold text-forest border border-forest px-2 py-1">
                  Disponible
                </span>
              </>
            ) : product.en_rupture ? (
              <span className="inline-block font-tag text-[11px] uppercase font-semibold text-rust border border-rust px-2 py-1">
                Bientôt de retour
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-10 border border-ink/15 bg-paper">
          <div className="flex border-b border-ink/15">
            <button
              onClick={() => setActiveTab('description')}
              className={`font-tag text-xs uppercase font-semibold px-4 py-3 border-b-2 ${
                activeTab === 'description'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`font-tag text-xs uppercase font-semibold px-4 py-3 border-b-2 ${
                activeTab === 'ingredients'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-muted'
              }`}
            >
              Détails du produit
            </button>
          </div>
          <div className="p-5 font-body text-sm text-ink leading-relaxed">
            {activeTab === 'description' ? (
              product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                'Description à venir.'
              )
            ) : product.ingredients ? (
              <div dangerouslySetInnerHTML={{ __html: product.ingredients }} />
            ) : (
              'Détails du produit à venir.'
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl text-ink mb-4">
              Dans la même catégorie
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
