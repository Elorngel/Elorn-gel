import { useState } from 'react'

export default function NewProductModal({ categories, subcategoriesByCategory, onCreate, onClose }) {
  const [codeArticle, setCodeArticle] = useState('')
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState(categories[0] || '')
  const [sousCategorie, setSousCategorie] = useState('')
  const [fournisseur, setFournisseur] = useState('')
  const [poids, setPoids] = useState('')
  const [prixLivraison, setPrixLivraison] = useState('')
  const [saving, setSaving] = useState(false)

  const subOptions = subcategoriesByCategory[categorie] || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)
    try {
      await onCreate({
        code_article: codeArticle.trim() || null,
        nom: nom.trim(),
        categorie: categorie || null,
        sous_categorie: sousCategorie || null,
        fournisseur: fournisseur.trim() || null,
        poids: poids.trim() || null,
        prix_livraison: parseFloat(prixLivraison) || 0,
        actif: false,
      })
      onClose()
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-paper w-full max-w-md border border-ink/20 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/15 sticky top-0 bg-paper">
          <h3 className="font-display text-xl text-ink">Nouveau produit</h3>
          <button
            type="button"
            onClick={onClose}
            className="font-tag text-xs uppercase text-muted hover:text-ink"
          >
            Fermer
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Désignation *
            </label>
            <input
              required
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              autoFocus
              className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                Référence article
              </label>
              <input
                type="text"
                value={codeArticle}
                onChange={(e) => setCodeArticle(e.target.value)}
                className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                Prix livraison (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={prixLivraison}
                onChange={(e) => setPrixLivraison(e.target.value)}
                className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                Catégorie
              </label>
              <select
                value={categorie}
                onChange={(e) => {
                  setCategorie(e.target.value)
                  setSousCategorie('')
                }}
                className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
              >
                <option value="">— choisir —</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                Sous-catégorie
              </label>
              <select
                value={sousCategorie}
                onChange={(e) => setSousCategorie(e.target.value)}
                disabled={subOptions.length === 0}
                className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none disabled:bg-stone"
              >
                <option value="">— non classé —</option>
                {subOptions.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                Fournisseur
              </label>
              <input
                type="text"
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block font-tag text-[10px] uppercase text-muted mb-1">
                Poids
              </label>
              <input
                type="text"
                placeholder="Ex : 500 g"
                value={poids}
                onChange={(e) => setPoids(e.target.value)}
                className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
              />
            </div>
          </div>

          <p className="font-tag text-[11px] text-muted">
            Le produit sera créé masqué (non publié) — publie-le depuis le tableau une
            fois la fiche complétée (photo, description...).
          </p>

          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted"
          >
            {saving ? 'Création…' : 'Créer le produit'}
          </button>
        </div>
      </form>
    </div>
  )
}
