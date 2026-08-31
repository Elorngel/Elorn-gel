import { useState } from 'react'

export default function ProductDetailsModal({ product, onSave, onClose }) {
  const [description, setDescription] = useState(product.description || '')
  const [ingredients, setIngredients] = useState(product.ingredients || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ description, ingredients })
      onClose()
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
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
          <label className="block font-tag text-xs uppercase text-muted mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-ink/20 p-2 font-body text-sm mb-4 focus:border-forest focus:outline-none"
            placeholder="Ex : Filets de cabillaud pêchés en Atlantique Nord, sans arêtes."
          />

          <label className="block font-tag text-xs uppercase text-muted mb-1">
            Détails du produit
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={4}
            className="w-full border border-ink/20 p-2 font-body text-sm mb-4 focus:border-forest focus:outline-none"
            placeholder="Ex : Ingrédients, valeurs nutritionnelles, origine, conditionnement…"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
