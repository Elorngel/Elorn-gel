import { createContext, useContext, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'

const PriceModeContext = createContext(null)

export function PriceModeProvider({ children }) {
  const [mode, setMode] = useState('livraison')
  const { settings } = useSiteSettings()

  // Le pourcentage de remise se règle dans l'admin (Réglages du site).
  // 0 par défaut tant que les réglages ne sont pas encore chargés, pour ne
  // jamais afficher un "-X%" qui ne correspond à rien (sinon un court flash
  // apparaît au chargement de la page, avant que la vraie valeur n'arrive).
  const discountPercent = settings?.remise_retrait ?? 0

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
