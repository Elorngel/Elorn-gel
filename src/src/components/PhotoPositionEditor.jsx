import { useRef, useState } from 'react'

// Version interactive : boutons +/- (ou molette si dispo) pour zoomer,
// glisser-déposer pour recentrer. Utilise les mêmes valeurs (zoom, posX,
// posY) que CroppableImage, donc ce que tu règles ici s'affiche à
// l'identique sur le site.
export default function PhotoPositionEditor({ url, zoom, posX, posY, onChange }) {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const clamp = (val, min, max) => Math.min(max, Math.max(min, val))

  const setZoom = (newZoom) => {
    onChange({ zoom: clamp(newZoom, 1, 3), posX, posY })
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    setZoom(zoom + delta)
  }

  const handleMouseDown = () => setDragging(true)
  const handleMouseUp = () => setDragging(false)

  const handleMouseMove = (e) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const deltaXPercent = (e.movementX / rect.width) * 100
    const deltaYPercent = (e.movementY / rect.height) * 100
    const newPosX = clamp(posX - deltaXPercent / zoom, 0, 100)
    const newPosY = clamp(posY - deltaYPercent / zoom, 0, 100)
    onChange({ zoom, posX: newPosX, posY: newPosY })
  }

  if (!url) {
    return (
      <div className="w-full h-56 bg-stone flex items-center justify-center font-tag text-xs text-muted">
        Choisis d'abord une photo
      </div>
    )
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative w-full h-56 overflow-hidden bg-stone cursor-move select-none border border-ink/20"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          className="pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            transform: `scale(${zoom})`,
            transformOrigin: `${posX}% ${posY}%`,
          }}
        />

        <div className="absolute bottom-2 right-2 flex border border-ink/30 bg-paper">
          <button
            type="button"
            onClick={() => setZoom(zoom - 0.15)}
            className="w-8 h-8 font-display text-lg leading-none hover:bg-stone"
            aria-label="Dézoomer"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoom(zoom + 0.15)}
            className="w-8 h-8 font-display text-lg leading-none border-l border-ink/30 hover:bg-stone"
            aria-label="Zoomer"
          >
            +
          </button>
        </div>
      </div>
      <p className="font-tag text-[10px] text-muted mt-1.5">
        Boutons +/- pour zoomer (ou molette si tu as une souris) · cliquer-glisser pour recentrer
      </p>
    </div>
  )
}
