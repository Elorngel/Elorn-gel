// Affiche une image positionnée/zoomée selon des valeurs enregistrées.
// zoom: 1 = ajustée normalement, plus grand = zoomée.
// posX / posY : 0 à 100, le point de l'image centré dans le cadre.
// Le conteneur parent doit avoir "position: relative" et une hauteur définie
// (ou "overflow-hidden" avec une hauteur fixée par ex. h-36) : cette image
// se cale dessus en absolu, elle ne détermine jamais la taille du cadre.
export default function CroppableImage({
  src,
  alt = '',
  zoom = 1,
  posX = 50,
  posY = 50,
  className = '',
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 ${className}`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: `${posX}% ${posY}%`,
        transform: `scale(${zoom})`,
        transformOrigin: `${posX}% ${posY}%`,
      }}
    />
  )
}
