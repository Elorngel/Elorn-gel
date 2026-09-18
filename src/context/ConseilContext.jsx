import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Ouvre/ferme l'assistant "Besoin d'un conseil ?" depuis n'importe quelle page
// (le bouton est dans l'en-tête, l'assistant est affiché une seule fois dans App).
const ConseilContext = createContext(null)

export function ConseilProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Cliquer sur une fiche produit change l'adresse (#produit/…) : on referme
  // l'assistant pour que le client voie la page.
  useEffect(() => {
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [close])

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])

  return <ConseilContext.Provider value={value}>{children}</ConseilContext.Provider>
}

export function useConseil() {
  const ctx = useContext(ConseilContext)
  if (!ctx) {
    throw new Error('useConseil must be used within a ConseilProvider')
  }
  return ctx
}
