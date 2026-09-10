import { useState } from 'react'
import RichTextEditor from './RichTextEditor'
import { getPricePerUnitLabel } from '../lib/pricing'
import { useAccompagnements } from '../hooks/useAccompagnements'

export default function ProductDetailsModal({
  product,
  onSave,
  updateProduct,
  onOpenVariants,
  onClose,
  allProducts = [],
}) {
  const [description, setDescription] = useState(product.description || '')
  const [ingredients, setIngredients] = useState(product.ingredients || '')
  const [saving, setSaving] = useState(false)

  const [prixKgDraft, setPrixKgDraft] = useState(product.prix_kg_ref ?? '')
  const [poidsDraft, setPoidsDraft] = useState(product.poids_kg ?? '')
  const [poidsVariable, setPoidsVariable] = useState(product.poids_variable)
  const [dispoLivraison, setDispoLivraison] = useState(product.dispo_livraison !== false)
  const [dispoRetrait, setDispoRetrait] = useState(product.dispo_retrait !== false)
  const [refQuantiteDraft, setRefQuantiteDraft] = useState(product.poids_reference ?? '')
  const [refUnite, setRefUnite] = useState(product.unite_reference || 'kg')
  const [associeSearch, setAssocieSearch] = useState('')
  const { items: accompItems, addAssociation, removeAssociation } = useAccompagnements(product.id)
  const [labelDraft, setLabelDraft] = useState(
    product.produit_associe_label || 'Idéal en accompagnement'
  )

  const MAX_ACCOMPAGNEMENTS = 3

  const accompProducts = accompItems
    .map((row) => ({ row, produit: allProducts.find((p) => p.id === row.produit_associe_id) }))
    .filter((x) => x.produit)

  const associeResults = associeSearch.trim()
    ? allProducts
        .filter(
          (p) =>
            p.id !== product.id &&
            !accompItems.some((row) => row.produit_associe_id === p.id) &&
            p.nom.toLowerCase().includes(associeSearch.trim().toLowerCase())
        )
        .slice(0, 8)
    : []

  const choisirAssocie = async (p) => {
    try {
      await addAssociation(p.id)
      setAssocieSearch('')
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const retirerAssocie = async (rowId) => {
    try {
      await removeAssociation(rowId)
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const saveLabel = () => {
    if (labelDraft !== product.produit_associe_label) {
      updateProduct(product.id, { produit_associe_label: labelDraft })
    }
  }

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

  const toggleDispoLivraison = () => {
    const newValue = !dispoLivraison
    setDispoLivraison(newValue)
    updateProduct(product.id, { dispo_livraison: newValue })
  }

  const toggleDispoRetrait = () => {
    const newValue = !dispoRetrait
    setDispoRetrait(newValue)
    updateProduct(product.id, { dispo_retrait: newValue })
  }

  const recomputePrixParUnite = (quantite, unite) => {
    const q = parseFloat(quantite)
    if (!isNaN(q) && q > 0) {
      updateProduct(product.id, {
        poids_reference: q,
        unite_reference: unite,
      })
    }
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
          <label className="flex items-center gap-2 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={dispoLivraison}
              onChange={toggleDispoLivraison}
              className="w-4 h-4"
            />
            <span className="font-body text-sm">Disponible en livraison</span>
          </label>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={dispoRetrait}
              onChange={toggleDispoRetrait}
              className="w-4 h-4"
            />
            <span className="font-body text-sm">Disponible en retrait</span>
          </label>

          <label className="block font-tag text-xs uppercase text-muted mb-1">
            Description
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Ex : Filets de cabillaud pêchés en Atlantique Nord, sans arêtes."
          />

          <label className="block font-tag text-xs uppercase text-muted mb-1">
            Ingrédients
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
              Prix au poids / au litre (calcul automatique)
            </p>
            <p className="font-body text-xs text-muted mb-2">
              Indique le poids net (ou volume) du produit tel qu'il est vendu — le prix
              au kg ou au litre affiché sur le site reste calculé en permanence à partir
              du prix actuel, même si tu le modifies plus tard.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                  Quantité nette
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Ex : 0.44"
                  value={refQuantiteDraft}
                  onChange={(e) => setRefQuantiteDraft(e.target.value)}
                  onBlur={() => recomputePrixParUnite(refQuantiteDraft, refUnite)}
                  className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
                />
              </div>
              <div className="w-24">
                <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                  Unité
                </label>
                <select
                  value={refUnite}
                  onChange={(e) => {
                    setRefUnite(e.target.value)
                    recomputePrixParUnite(refQuantiteDraft, e.target.value)
                  }}
                  className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="l">L</option>
                </select>
              </div>
            </div>
            {(product.poids_reference || product.prix_par_kg) && (
              <p className="font-tag text-xs text-forest mt-2">
                Affiché sur le site : {getPricePerUnitLabel(product, product.prix_livraison)}
              </p>
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

          <div className="border-t border-ink/15 mt-5 pt-5">
            <p className="font-tag text-xs uppercase text-muted mb-2">
              Suggestions d'accompagnement (2-3 max, affiché sous "Ajouter au panier")
            </p>

            {accompProducts.length > 0 ? (
              <div className="flex flex-col gap-1 mb-2">
                {accompProducts.map(({ row, produit }) => (
                  <div key={row.id} className="flex items-center justify-between bg-stone p-2">
                    <span className="font-body text-sm">{produit.nom}</span>
                    <button
                      onClick={() => retirerAssocie(row.id)}
                      className="font-tag text-[10px] uppercase text-rust shrink-0"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body text-xs text-muted mb-2">Aucune suggestion pour l'instant.</p>
            )}

            {accompProducts.length < MAX_ACCOMPAGNEMENTS ? (
              <>
                <input
                  type="text"
                  placeholder="Chercher un produit à suggérer…"
                  value={associeSearch}
                  onChange={(e) => setAssocieSearch(e.target.value)}
                  className="w-full border border-ink/20 p-1.5 font-body text-sm mb-1 focus:border-forest focus:outline-none"
                />
                {associeResults.length > 0 && (
                  <div className="border border-ink/15 mb-2 max-h-40 overflow-y-auto">
                    {associeResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => choisirAssocie(p)}
                        className="block w-full text-left px-2 py-1.5 font-body text-sm hover:bg-stone border-b border-ink/10 last:border-b-0"
                      >
                        {p.nom}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="font-tag text-[11px] text-muted mb-2">
                Maximum de {MAX_ACCOMPAGNEMENTS} suggestions atteint — retire-en une pour en
                ajouter une autre.
              </p>
            )}

            {accompProducts.length > 0 && (
              <div>
                <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                  Texte affiché au-dessus
                </label>
                <input
                  type="text"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onBlur={saveLabel}
                  className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
