import { createContext, useContext, useState } from 'react'

const PriceModeContext = createContext(null)

export const PICKUP_DISCOUNT = 0.2

export function PriceModeProvider({ children }) {
  const [mode, setMode] = useState('livraison')

  const value = {
    mode,
    setMode,
    isPickup: mode === 'retrait',
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

export function getPickupPrice(priceLivraison) {
  return priceLivraison * (1 - PICKUP_DISCOUNT)
}
