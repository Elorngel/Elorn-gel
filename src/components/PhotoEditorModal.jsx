import { useState } from 'react'
import PhotoPositionEditor from './PhotoPositionEditor'
import ExistingPhotoPicker from './ExistingPhotoPicker'

export default function PhotoEditorModal({
  title,
  initialUrl,
  initialZoom = 1,
  initialPosX = 50,
  initialPosY = 50,
  onUpload, // (file) => Promise<url>
  onPickExisting, // (url d'une photo déjà sur le site) => Promise<nouvelle url> ; absent = pas de choix parmi les photos du site
  onSave, // ({ url, zoom, posX, posY }) => Promise
  onClose,
  aspect = 1, // format du cadre (largeur / hauteur) : 1 = carré ; 16 / 9 = bannière
  hint,
}) {
  const [url, setUrl] = useState(initialUrl || '')
  const [zoom, setZoom] = useState(initialZoom)
  const [posX, setPosX] = useState(initialPosX)
  const [posY, setPosY] = useState(initialPosY)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState(false)

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

  const handlePickExisting = async (existingUrl) => {
    setUploading(true)
    try {
      const newUrl = await onPickExisting(existingUrl)
      setUrl(newUrl)
      setZoom(1)
      setPosX(50)
      setPosY(50)
      setPicking(false)
    } catch (err) {
      alert(`Erreur : ${err.message}`)
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
      <div className={`bg-paper w-full border border-ink/20 ${aspect === 1 ? 'max-w-md' : 'max-w-xl'}`}>
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
            aspect={aspect}
            onChange={({ zoom: z, posX: x, posY: y }) => {
              setZoom(z)
              setPosX(x)
              setPosY(y)
            }}
          />

          {hint && <p className="font-body text-xs text-forest mt-2">{hint}</p>}

          <label className="mt-3 block w-full text-center border border-ink/40 font-tag text-xs uppercase font-semibold py-2 cursor-pointer hover:bg-stone">
            {uploading ? 'Envoi en cours…' : url ? 'Changer de photo' : 'Choisir une photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {onPickExisting && (
            <>
              <button
                type="button"
                onClick={() => setPicking((v) => !v)}
                className="mt-2 w-full border border-forest text-forest font-tag text-xs uppercase font-semibold py-2 hover:bg-forest hover:text-paper transition-colors"
              >
                {picking ? 'Fermer la liste des photos du site' : 'Choisir une photo déjà sur le site'}
              </button>
              {picking && <ExistingPhotoPicker onPick={handlePickExisting} disabled={uploading} />}
            </>
          )}

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
