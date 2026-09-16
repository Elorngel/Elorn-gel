import { useState } from 'react'
import { useSuppliers } from '../hooks/useSuppliers'
import PhotoEditorModal from './PhotoEditorModal'
import CroppableImage from './CroppableImage'

export default function SuppliersPanel() {
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, uploadLogo } =
    useSuppliers()
  const [newName, setNewName] = useState('')
  const [editingLogo, setEditingLogo] = useState(null) // supplier object

  if (loading) {
    return <p className="font-body text-sm text-muted">Chargement des fournisseurs…</p>
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      await addSupplier(newName)
      setNewName('')
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const handleDelete = async (supplier) => {
    if (confirm(`Supprimer le fournisseur "${supplier.nom}" ? Le logo disparaîtra des fiches produits concernées.`)) {
      try {
        await deleteSupplier(supplier.id)
      } catch (err) {
        alert(`Erreur : ${err.message}`)
      }
    }
  }

  return (
    <div>
      <p className="font-body text-sm text-muted mb-4">
        Ajoute un logo par fournisseur — il s'affichera automatiquement sur la fiche des
        produits qui lui sont associés. Sans logo, rien ne s'affiche sur le site.
      </p>

      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4 max-w-md">
        <input
          type="text"
          placeholder="Nom du nouveau fournisseur"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
        />
        <button
          type="submit"
          className="bg-ink text-paper font-tag text-xs font-semibold uppercase px-3 py-2 hover:bg-forest"
        >
          Ajouter
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-paper border border-ink/15 p-3">
            <button
              onClick={() => setEditingLogo(s)}
              className="relative w-full h-20 bg-stone border border-ink/10 overflow-hidden mb-2 flex items-center justify-center"
            >
              {s.logo_url ? (
                <CroppableImage
                  src={s.logo_url}
                  alt={s.nom}
                  zoom={s.logo_zoom ?? 1}
                  posX={s.logo_pos_x ?? 50}
                  posY={s.logo_pos_y ?? 50}
                  fit="contain"
                />
              ) : (
                <span className="font-tag text-[10px] uppercase text-muted">
                  Ajouter un logo
                </span>
              )}
            </button>
            <p className="font-body text-sm font-semibold truncate mb-1">{s.nom}</p>
            <button
              onClick={() => handleDelete(s)}
              className="font-tag text-[10px] uppercase text-rust"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <p className="font-body text-sm text-muted">Aucun fournisseur pour l'instant.</p>
      )}

      {editingLogo && (
        <PhotoEditorModal
          title={`Logo — ${editingLogo.nom}`}
          initialUrl={editingLogo.logo_url}
          initialZoom={editingLogo.logo_zoom ?? 1}
          initialPosX={editingLogo.logo_pos_x ?? 50}
          initialPosY={editingLogo.logo_pos_y ?? 50}
          onUpload={(file) => uploadLogo(editingLogo.id, file)}
          onSave={({ url, zoom, posX, posY }) =>
            updateSupplier(editingLogo.id, {
              logo_url: url,
              logo_zoom: zoom,
              logo_pos_x: posX,
              logo_pos_y: posY,
            })
          }
          onClose={() => setEditingLogo(null)}
        />
      )}
    </div>
  )
}
