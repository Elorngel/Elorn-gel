// Affiche une image positionnée/zoomée selon des valeurs enregistrées.
// zoom: 1 = ajustée normalement, plus grand = zoomée.
// posX / posY : 0 à 100, le point de l'image centré dans le cadre.
// fit: 'cover' remplit tout le cadre (peut couper les bords), 'contain'
// montre la photo entière sans jamais la couper (peut laisser un peu de
// fond visible sur les côtés si le format ne correspond pas).
// Le conteneur parent doit avoir "position: relative" et une hauteur définie
// (ou "overflow-hidden" avec une hauteur fixée par ex. h-36) : cette image
// se cale dessus en absolu, elle ne détermine jamais la taille du cadre.
import { urlPhoto, photoDeSecours } from '../lib/photos'

// loading 'lazy' (par défaut) : la photo ne se télécharge qu'en arrivant à l'écran, ce qui
// économise le quota Supabase ; 'eager' pour une image visible dès l'arrivée (bannière).
export default function CroppableImage({
  src,
  alt = '',
  zoom = 1,
  posX = 50,
  posY = 50,
  fit = 'cover',
  className = '',
  loading = 'lazy',
}) {
  return (
    <img
      key={src}
      src={urlPhoto(src)}
      onError={(e) => photoDeSecours(e.currentTarget, src)}
      alt={alt}
      loading={loading}
      decoding="async"
      className={`absolute inset-0 ${className}`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: fit,
        objectPosition: `${posX}% ${posY}%`,
        transform: `scale(${zoom})`,
        transformOrigin: `${posX}% ${posY}%`,
      }}
    />
  )
}
