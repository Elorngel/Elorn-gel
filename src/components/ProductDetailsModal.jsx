import { useState } from 'react'
import RichTextEditor from './RichTextEditor'

export default function ProductDetailsModal({
  product,
  onSave,
  updateProduct,
  onOpenVariants,
  onClose,
}) {
  const [description, setDescription] = useState(product.description || '')
  const [ingredients, setIngredients] = useState(product.ingredients || '')
  const [saving, setSaving] = useState(false)

  const [prixKgDraft, setPrixKgDraft] = useState(product.prix_kg_ref ?? '')
  const [poidsDraft, setPoidsDraft] = useState(product.poids_kg ?? '')
  const [poidsVariable, setPoidsVariable] = useState(product.poids_variable)

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

  const recomputePoidsVariable = (prixKg, poidsKg) => {
    const p = parseFloat(prixKg)
    const k = parseFloat(poidsKg)
    if (!isNaN(p) && !isNaN(k)) {
      updateProduct(product.id, {
        prix_kg_ref: p,
        poids_kg: k,
        prix_livraison: Math.round(p * k * 100) / 100,
        poids: `${k} kg`,
      })
    }
  }

  const togglePoidsVariable = () => {
    const newValue = !poidsVariable
    setPoidsVariable(newValue)
    updateProduct(product.id, { poids_variable: newValue })
  }

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-paper w-full max-w-lg border border-ink/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/15 sticky top-0 bg-paper">
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
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Ex : Filets de cabillaud pêchés en Atlantique Nord, sans arêtes."
          />

          <label className="block font-tag text-xs uppercase text-muted mb-1">
            Détails du produit
          </label>
          <RichTextEditor
            value={ingredients}
            onChange={setIngredients}
            placeholder="Ex : Ingrédients, valeurs nutritionnelles, origine, conditionnement…"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>

          <div className="border-t border-ink/15 mt-5 pt-5">
            <p className="font-tag text-xs uppercase text-muted mb-2">
              Poids variable (ex : volaille fermière)
            </p>
            <button
              onClick={togglePoidsVariable}
              className={`font-tag text-xs uppercase font-semibold px-3 py-2 border w-full mb-2 ${
                poidsVariable
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/40 text-ink'
              }`}
            >
              {poidsVariable ? 'Activé' : 'Désactivé — cliquer pour activer'}
            </button>

            {poidsVariable && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                    Prix / kg de référence
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={prixKgDraft}
                      onChange={(e) => setPrixKgDraft(e.target.value)}
                      onBlur={() => recomputePoidsVariable(prixKgDraft, poidsDraft)}
                      className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
                    />
                    <span className="font-tag text-xs shrink-0">€/kg</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                    Poids actuel
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={poidsDraft}
                      onChange={(e) => setPoidsDraft(e.target.value)}
                      onBlur={() => recomputePoidsVariable(prixKgDraft, poidsDraft)}
                      className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
                    />
                    <span className="font-tag text-xs shrink-0">kg</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-ink/15 mt-5 pt-5">
            <p className="font-tag text-xs uppercase text-muted mb-2">
              Conditionnements (500 g, 1 kg, 1,5 kg…)
            </p>
            <button
              onClick={onOpenVariants}
              className={`font-tag text-xs uppercase font-semibold px-3 py-2 border w-full ${
                product.variantes?.length > 0
                  ? 'border-forest text-forest'
                  : 'border-ink/40 text-ink'
              } hover:bg-stone`}
            >
              {product.variantes?.length > 0
                ? `Gérer les ${product.variantes.length} tailles`
                : 'Ajouter des conditionnements'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
