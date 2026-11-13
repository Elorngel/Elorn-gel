import { usePriceMode } from '../context/PriceModeContext'

// Rappel « Passer en Retrait » sous la bannière, en mode Livraison (aussi utilisé par la bannière des fêtes).
export default function BandeauRetrait() {
  const { mode, setMode } = usePriceMode()
  if (mode !== 'livraison') return null
  return (
      <div className="bg-stone border-b border-ink/15 px-5 py-3 flex items-center justify-center gap-3 flex-wrap text-center">
        <p className="font-body text-sm text-ink">
          📦 Vous commandez régulièrement ? En mode <strong>Retrait</strong>, retrouvez
          des conditionnements plus petits, adaptés aux commandes fréquentes.
        </p>
        <button
          onClick={() => setMode('retrait')}
          className="font-tag text-xs uppercase font-semibold text-forest hover:underline shrink-0"
        >
          Passer en Retrait →
        </button>
      </div>
  )
}
