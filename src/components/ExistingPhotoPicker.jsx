import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const MAX_SHOWN = 40

// Liste les photos déjà présentes sur le site (photos des produits publiés)
// pour en choisir une sans passer par l'ordinateur. Les miniatures ne se
// chargent que lorsqu'elles sont visibles (loading="lazy").
export default function ExistingPhotoPicker({ onPick, disabled }) {
  const [photos, setPhotos] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    supabase
      .from('produits')
      .select('id, nom, photo_url')
      .eq('actif', true)
      .not('photo_url', 'is', null)
      .order('nom', { ascending: true })
      .then(({ data }) => setPhotos(data || []))
  }, [])

  const filtered = useMemo(() => {
    if (!photos) return []
    const q = query.trim().toLowerCase()
    return q ? photos.filter((p) => p.nom.toLowerCase().includes(q)) : photos
  }, [photos, query])

  return (
    <div className="mt-3 border border-ink/20 p-3 bg-stone/40">
      <input
        type="text"
        autoFocus
        placeholder="Rechercher un produit (ex : coquilles, glace…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-ink/20 p-2 font-body text-sm bg-paper focus:border-forest focus:outline-none"
      />

      {photos === null ? (
        <p className="font-body text-xs text-muted mt-3">Chargement des photos…</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-xs text-muted mt-3">Aucune photo trouvée.</p>
      ) : (
        <>
          <div
            className={`grid grid-cols-4 gap-2 mt-3 max-h-64 overflow-y-auto ${
              disabled ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {filtered.slice(0, MAX_SHOWN).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p.photo_url)}
                title={p.nom}
                className="text-left border border-ink/15 bg-paper hover:border-forest"
              >
                <img
                  src={p.photo_url}
                  alt={p.nom}
                  loading="lazy"
                  className="w-full aspect-square object-cover bg-stone"
                />
                <span className="block font-tag text-[10px] leading-tight p-1 line-clamp-2">
                  {p.nom}
                </span>
              </button>
            ))}
          </div>
          {filtered.length > MAX_SHOWN && (
            <p className="font-body text-xs text-muted mt-2">
              {filtered.length} photos : tapez un mot pour affiner la recherche.
            </p>
          )}
        </>
      )}
    </div>
  )
}
