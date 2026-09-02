import { createContext, useContext, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'

const PriceModeContext = createContext(null)

export function PriceModeProvider({ children }) {
  const [mode, setMode] = useState('livraison')
  const { settings } = useSiteSettings()

  // Le pourcentage de remise se règle dans l'admin (Réglages du site).
  // 10 par défaut tant que la base ne renvoie rien.
  const discountPercent = settings?.remise_retrait ?? 10

  const getPickupPrice = (priceLivraison) =>
    priceLivraison * (1 - discountPercent / 100)

  const value = {
    mode,
    setMode,
    isPickup: mode === 'retrait',
    discountPercent,
    getPickupPrice,
  }

  return (
    <PriceModeContext.Provider value={value}>
      {children}
    </PriceModeContext.Provider>
  )
}

export function usePriceMode() {
  const ctx = useContext(PriceModeContext)
  if (!ctx) {
    throw new Error('usePriceMode must be used within a PriceModeProvider')
  }
  return ctx
}
