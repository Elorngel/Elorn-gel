// Redimensionne et compresse une photo dans le navigateur, avant son envoi à
// Supabase — sans ça, une photo de téléphone (souvent 3 à 8 Mo) est stockée
// telle quelle et resservie en entier à chaque visiteur du site, ce qui a
// déjà fait dépasser le quota gratuit de Supabase une fois (voir le ménage
// fait le 01/10/2026 : 522 Mo → 41 Mo rien qu'en compressant les photos
// existantes, sans aucune perte visible).
//
// Les photos du site n'ont jamais besoin de transparence (ce sont des photos
// de plats), donc tout part en JPEG — sauf si l'image de départ a un fond
// réellement transparent (ex : un futur logo), auquel cas on garde le PNG.

const MAX_DIMENSION = 1600 // largeur/hauteur max ; bien au-delà de ce qui s'affiche sur le site
const JPEG_QUALITY = 0.85

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de lire cette image."))
    }
    img.src = url
  })
}

// Échantillonne le canal alpha plutôt que de le lire pixel par pixel en
// entier (inutile et lent sur une grande image) : suffisant pour distinguer
// une vraie transparence d'un PNG opaque exporté par erreur en PNG.
function hasRealTransparency(ctx, width, height) {
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 4000)))
  for (let y = 0; y < height; y += step) {
    const row = ctx.getImageData(0, y, width, 1).data
    for (let x = 0; x < row.length; x += 4 * step) {
      if (row[x + 3] < 250) return true
    }
  }
  return false
}

// Renvoie un nouveau File prêt à envoyer (toujours plus léger, jamais plus
// lourd que l'original : si la compression ne gagne rien, on garde l'original).
export async function resizeImageFile(file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) {
  // SVG et GIF (animés) : rien à gagner à les repasser par un canvas, on les laisse tels quels.
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file

  let img, url
  try {
    ;({ img, url } = await loadImage(file))
  } catch {
    return file // image illisible par le navigateur : on envoie l'original plutôt que de bloquer
  }

  try {
    const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height))
    const width = Math.round(img.width * ratio)
    const height = Math.round(img.height * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    const keepPng = file.type === 'image/png' && hasRealTransparency(ctx, width, height)
    const outType = keepPng ? 'image/png' : 'image/jpeg'
    const outExt = keepPng ? 'png' : 'jpg'

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outType, quality))
    if (!blob || blob.size >= file.size) return file

    const newName = file.name.replace(/\.[a-zA-Z0-9]+$/, '') + '.' + outExt
    return new File([blob], newName, { type: outType })
  } finally {
    URL.revokeObjectURL(url)
  }
}
