import { useState } from 'react'
import { useCategories } from '../hooks/useCategories'

function EditableName({ value, onSave }) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft.trim() && draft !== value) onSave(draft.trim())
      }}
      className="bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-sm py-1 flex-1 min-w-0"
    />
  )
}

export default function CategoriesPanel() {
  const {
    categoriesFull,
    subcategoriesFull,
    loading,
    addCategory,
    renameCategory,
    deleteCategory,
    addSubcategory,
    renameSubcategory,
    deleteSubcategory,
  } = useCategories()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryDrafts, setNewSubcategoryDrafts] = useState({})

  if (loading) {
    return <p className="font-body text-sm text-muted">Chargement des catégories…</p>
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      await addCategory(newCategoryName.trim())
      setNewCategoryName('')
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const handleAddSubcategory = async (e, categorieId) => {
    e.preventDefault()
    const nom = (newSubcategoryDrafts[categorieId] || '').trim()
    if (!nom) return
    try {
      await addSubcategory(categorieId, nom)
      setNewSubcategoryDrafts((prev) => ({ ...prev, [categorieId]: '' }))
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  return (
    <div>
      <p className="font-body text-sm text-muted mb-4">
        Ajoute, renomme ou supprime les rayons et leurs sous-catégories. Renommer un
        rayon met aussi à jour les produits déjà classés dedans.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoriesFull.map((cat) => {
          const subs = subcategoriesFull.filter((s) => s.categorie_id === cat.id)
          return (
            <div key={cat.id} className="bg-paper border border-ink/15 p-3">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-ink/10">
                <EditableName
                  value={cat.nom}
                  onSave={(newNom) => renameCategory(cat.id, cat.nom, newNom)}
                />
                <button
                  onClick={() => {
                    if (confirm(`Supprimer le rayon "${cat.nom}" ?`)) {
                      deleteCategory(cat.id)
                    }
                  }}
                  className="font-tag text-[10px] uppercase text-rust shrink-0"
                >
                  Suppr.
                </button>
              </div>

              <div className="flex flex-col gap-1 mb-2">
                {subs.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <span className="font-tag text-xs text-muted">—</span>
                    <EditableName
                      value={sub.nom}
                      onSave={(newNom) => renameSubcategory(sub.id, sub.nom, newNom)}
                    />
                    <button
                      onClick={() => deleteSubcategory(sub.id)}
                      className="font-tag text-[10px] uppercase text-rust shrink-0"
                    >
                      Suppr.
                    </button>
                  </div>
                ))}
                {subs.length === 0 && (
                  <p className="font-tag text-xs text-muted">Aucune sous-catégorie</p>
                )}
              </div>

              <form
                onSubmit={(e) => handleAddSubcategory(e, cat.id)}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Nouvelle sous-catégorie"
                  value={newSubcategoryDrafts[cat.id] || ''}
                  onChange={(e) =>
                    setNewSubcategoryDrafts((prev) => ({
                      ...prev,
                      [cat.id]: e.target.value,
                    }))
                  }
                  className="flex-1 border border-ink/20 p-1.5 font-body text-xs focus:border-forest focus:outline-none"
                />
                <button
                  type="submit"
                  className="font-tag text-[10px] uppercase font-semibold px-2 py-1.5 border border-ink/40 hover:bg-stone"
                >
                  Ajouter
                </button>
              </form>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleAddCategory} className="flex items-center gap-2 mt-4 max-w-md">
        <input
          type="text"
          placeholder="Nom du nouveau rayon"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-1 border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
        />
        <button
          type="submit"
          className="bg-ink text-paper font-tag text-xs font-semibold uppercase px-3 py-2 hover:bg-forest"
        >
          Ajouter un rayon
        </button>
      </form>
    </div>
  )
}
