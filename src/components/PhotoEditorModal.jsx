import { useState } from 'react'
import PhotoPositionEditor from './PhotoPositionEditor'

export default function PhotoEditorModal({
  title,
  initialUrl,
  initialZoom = 1,
  initialPosX = 50,
  initialPosY = 50,
  onUpload, // (file) => Promise<url>
  onSave, // ({ url, zoom, posX, posY }) => Promise
  onClose,
}) {
  const [url, setUrl] = useState(initialUrl || '')
  const [zoom, setZoom] = useState(initialZoom)
  const [posX, setPosX] = useState(initialPosX)
  const [posY, setPosY] = useState(initialPosY)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const newUrl = await onUpload(file)
      setUrl(newUrl)
      setZoom(1)
      setPosX(50)
      setPosY(50)
    } catch (err) {
      alert(`Erreur upload : ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ url, zoom, posX, posY })
      onClose()
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-paper w-full max-w-md border border-ink/20">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/15">
          <h3 className="font-display text-xl text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="font-tag text-xs uppercase text-muted hover:text-ink"
          >
            Fermer
          </button>
        </div>

        <div className="p-4">
          <PhotoPositionEditor
            url={url}
            zoom={zoom}
            posX={posX}
            posY={posY}
            onChange={({ zoom: z, posX: x, posY: y }) => {
              setZoom(z)
              setPosX(x)
              setPosY(y)
            }}
          />

          <label className="mt-3 block w-full text-center border border-ink/40 font-tag text-xs uppercase font-semibold py-2 cursor-pointer hover:bg-stone">
            {uploading ? 'Envoi en cours…' : url ? 'Changer de photo' : 'Choisir une photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <button
            onClick={handleSave}
            disabled={!url || saving || uploading}
            className="mt-2 w-full bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
