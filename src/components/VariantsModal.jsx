import { useState } from 'react'
import { useVariants } from '../hooks/useVariants'

// Extrait un nombre depuis un texte comme "13,29 €/kg" -> 13.29
function parsePricePerKg(text) {
  if (!text) return null
  const match = String(text).replace(',', '.').match(/([\d.]+)/)
  if (!match) return null
  const value = parseFloat(match[1])
  return isNaN(value) ? null : value
}

// Extrait un poids en kg depuis un texte comme "500 g", "500g", "1 kg" -> 0.5, 1
function parseWeightToKg(text) {
  if (!text) return null
  const cleaned = String(text).toLowerCase().replace(',', '.')
  const match = cleaned.match(/([\d.]+)\s*(kg|g)?/)
  if (!match) return null
  const value = parseFloat(match[1])
  if (isNaN(value)) return null
  return match[2] === 'g' ? value / 1000 : value
}

export default function VariantsModal({ product, onClose }) {
  const { variants, loading, addVariant, updateVariant, deleteVariant, setDefault } =
    useVariants(product.id)
  const [newPoids, setNewPoids] = useState('')
  const [newPrix, setNewPrix] = useState('')
  const [prixModifieManuellement, setPrixModifieManuellement] = useState(false)
  const [adding, setAdding] = useState(false)

  const prixParKg = parsePricePerKg(product.prix_par_kg)

  const handlePoidsChange = (value) => {
    setNewPoids(value)
    if (!prixModifieManuellement && prixParKg) {
      const kg = parseWeightToKg(value)
      if (kg) {
        setNewPrix((prixParKg * kg).toFixed(2))
      }
    }
  }

  const handlePrixChange = (value) => {
    setNewPrix(value)
    setPrixModifieManuellement(true)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const prix = parseFloat(newPrix)
    if (!newPoids.trim() || isNaN(prix)) return
    setAdding(true)
    try {
      await addVariant(newPoids.trim(), prix)
      setNewPoids('')
      setNewPrix('')
      setPrixModifieManuellement(false)
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-paper w-full max-w-lg border border-ink/20">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/15">
          <h3 className="font-display text-xl text-ink">{product.nom}</h3>
          <button
            onClick={onClose}
            className="font-tag text-xs uppercase text-muted hover:text-ink"
          >
            Fermer
          </button>
        </div>

        <div className="p-4">
          <p className="font-body text-sm text-muted mb-3">
            Ajoute les différents conditionnements possibles (500 g, 1 kg, 1,5 kg…).
            Celui coché "Par défaut" est celui affiché dans le catalogue. Sans
            conditionnement ici, le produit garde son prix normal.
          </p>

          {loading ? (
            <p className="font-body text-sm text-muted">Chargement…</p>
          ) : (
            <div className="border border-ink/15 mb-4">
              {variants.length === 0 && (
                <p className="p-3 font-body text-sm text-muted">
                  Aucun conditionnement pour l'instant.
                </p>
              )}
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 p-2 border-b border-ink/10 last:border-b-0"
                >
                  <input
                    type="text"
                    defaultValue={v.poids}
                    onBlur={(e) => {
                      if (e.target.value !== v.poids) {
                        updateVariant(v.id, { poids: e.target.value })
                      }
                    }}
                    className="flex-1 border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={v.prix_livraison}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val !== v.prix_livraison) {
                        updateVariant(v.id, { prix_livraison: val })
                      }
                    }}
                    className="w-20 border border-ink/20 p-1.5 font-body text-sm text-right focus:border-forest focus:outline-none"
                  />
                  <span className="font-tag text-xs text-muted">€</span>
                  <button
                    onClick={() => setDefault(v.id)}
                    className={`font-tag text-[10px] uppercase font-semibold px-2 py-1.5 border shrink-0 ${
                      v.est_defaut
                        ? 'border-forest bg-forest text-paper'
                        : 'border-ink/30 text-ink'
                    }`}
                  >
                    {v.est_defaut ? 'Par défaut' : 'Choisir'}
                  </button>
                  <button
                    onClick={() => deleteVariant(v.id)}
                    className="font-tag text-[10px] uppercase text-rust px-2 py-1.5 shrink-0"
                  >
                    Suppr.
                  </button>
                </div>
              ))}
            </div>
          )}

          {prixParKg && (
            <p className="font-tag text-[11px] text-muted mb-2">
              Prix au kg de référence : {prixParKg.toFixed(2)} €/kg — le prix se calcule
              automatiquement selon le poids tapé, modifiable ensuite si besoin.
            </p>
          )}

          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ex : 500 g"
              value={newPoids}
              onChange={(e) => handlePoidsChange(e.target.value)}
              className="flex-1 border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Prix"
              value={newPrix}
              onChange={(e) => handlePrixChange(e.target.value)}
              className="w-20 border border-ink/20 p-1.5 font-body text-sm text-right focus:border-forest focus:outline-none"
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-ink text-paper font-tag text-xs font-semibold uppercase px-3 py-1.5 hover:bg-forest disabled:bg-muted"
            >
              Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
