import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'elorngel-panier'

function loadInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadInitialCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // stockage indisponible (navigation privée, etc.) : on continue sans persister
    }
  }, [items])

  const addItem = (product, quantity = 1, variant = null) => {
    const cartKey = variant ? `${product.id}::${variant.id}` : product.id

    setItems((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey)
      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [
        ...prev,
        {
          cartKey,
          id: product.id,
          nom: product.nom,
          prix_livraison: variant ? variant.prix_livraison : product.prix_livraison,
          prix_par_kg: product.prix_par_kg,
          en_promo: product.en_promo,
          taux_promo: product.taux_promo,
          photo_url: product.photo_url,
          photo_zoom: product.photo_zoom,
          photo_pos_x: product.photo_pos_x,
          photo_pos_y: product.photo_pos_y,
          poids: variant ? variant.poids : product.poids,
          quantity,
        },
      ]
    })
  }

  const removeItem = (cartKey) => {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey))
  }

  const updateQuantity = (cartKey, quantity) => {
    if (quantity < 1) {
      removeItem(cartKey)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity } : item))
    )
  }

  const clear = () => setItems([])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, itemCount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
