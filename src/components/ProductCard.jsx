import { useState } from 'react'
import { usePriceMode } from '../context/PriceModeContext'
import { useCart } from '../context/CartContext'
import CroppableImage from './CroppableImage'

export default function ProductCard({ product }) {
  const { isPickup, getPickupPrice, discountPercent } = usePriceMode()
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const pickupPrice = getPickupPrice(product.prix_livraison)
  const tags = product.tags
    ? product.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const handleAddToCart = () => {
    addItem(product, 1)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div
      className={`group relative border border-ink/15 bg-paper flex flex-col ${
        product.en_rupture ? 'opacity-60' : ''
      }`}
    >
      <a href={`#produit/${product.id}`} className="relative h-36 bg-stone flex items-center justify-center overflow-hidden">
        {product.photo_url ? (
          <CroppableImage
            src={product.photo_url}
            alt={product.nom}
            zoom={product.photo_zoom ?? 1}
            posX={product.photo_pos_x ?? 50}
            posY={product.photo_pos_y ?? 50}
          />
        ) : (
          <span className="font-tag text-xs uppercase tracking-wide text-muted">
            Photo produit
          </span>
        )}

        {product.en_rupture && (
          <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
            <span className="font-tag text-paper text-xs uppercase font-semibold tracking-wide border border-paper/60 px-3 py-1.5">
              Bientôt de retour
            </span>
          </div>
        )}

        {!product.en_rupture && isPickup && (
          <div
            className="absolute -right-2 top-3 rotate-[8deg] bg-rust text-paper font-tag font-bold text-xs px-3 py-1 shadow-sm"
            style={{ clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)' }}
          >
            -{discountPercent}% retrait
          </div>
        )}
      </a>

      <div className="p-3 flex flex-col grow">
        <a href={`#produit/${product.id}`}>
          <h3 className="font-body font-semibold text-sm leading-snug mb-1.5 hover:underline">
            {product.nom}
          </h3>
        </a>
        <p className="font-tag text-[11px] text-muted mb-1.5">{product.poids}</p>

        {tags.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-tag text-[10px] border border-ink/25 text-muted px-1.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="font-tag text-[10px] text-muted mb-0.5">{product.prix_par_kg}</p>

        <div className="flex items-baseline gap-2 mb-3">
          {isPickup ? (
            <>
              <span className="font-tag text-[11px] text-muted line-through">
                {product.prix_livraison.toFixed(2)} €
              </span>
              <span className="font-display text-2xl text-forest leading-none">
                {pickupPrice.toFixed(2)} €
              </span>
            </>
          ) : (
            <span className="font-display text-2xl text-ink leading-none">
              {product.prix_livraison.toFixed(2)} €
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.en_rupture}
          className={`mt-auto w-full font-tag text-xs font-semibold uppercase tracking-wide py-2 transition-colors disabled:bg-muted disabled:cursor-not-allowed ${
            justAdded ? 'bg-forest text-paper' : 'bg-ink text-paper hover:bg-forest'
          }`}
        >
          {product.en_rupture ? 'Indisponible' : justAdded ? 'Ajouté ✓' : 'Ajouter au panier'}
        </button>
      </div>
    </div>
  )
}
