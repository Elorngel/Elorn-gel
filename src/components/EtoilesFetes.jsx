import { useEffect, useRef } from 'react'
import { OR } from '../lib/fetes'

// Étoiles dorées sur tout le site pendant la période des fêtes (16/11/2026, à la place de la neige, refusée) : quelques
// petites étoiles à 4 branches, comme sur la bannière « Le menu des fêtes », qui descendent lentement en scintillant,
// par-dessus la page mais sans jamais gêner (aucun clic intercepté). Réglage : admin → onglet Fêtes (fetes.etoiles).
// Rien pour un visiteur qui a demandé à réduire les animations.
const ETOILE = new Path2D('M10 0 L11.6 8.4 L20 10 L11.6 11.6 L10 20 L8.4 11.6 L0 10 L8.4 8.4 Z')

export default function EtoilesFetes() {
  const ref = useRef(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let largeur = 0
    let hauteur = 0
    let etoiles = []
    let image = 0

    const nouvelle = (partout) => ({
      x: Math.random() * largeur,
      y: partout ? Math.random() * hauteur : -20,
      taille: 6 + Math.random() * 7, // 6 à 13 px
      vy: 0.15 + Math.random() * 0.3, // descente très lente
      phase: Math.random() * Math.PI * 2,
      angle: Math.random() * 0.6 - 0.3,
      tourne: (Math.random() - 0.5) * 0.004,
    })

    const dimensionner = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      largeur = window.innerWidth
      hauteur = window.innerHeight
      canvas.width = largeur * dpr
      canvas.height = hauteur * dpr
      canvas.style.width = `${largeur}px`
      canvas.style.height = `${hauteur}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Peu d'étoiles : environ 1 pour 60 px de large, 22 au plus.
      const nombre = Math.min(22, Math.round(largeur / 60))
      etoiles = Array.from({ length: nombre }, () => nouvelle(true))
    }

    const dessiner = () => {
      ctx.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0)
      ctx.clearRect(0, 0, largeur, hauteur)
      for (const e of etoiles) {
        e.phase += 0.02
        e.y += e.vy
        e.x += Math.sin(e.phase / 2) * 0.15
        e.angle += e.tourne
        if (e.y > hauteur + 20) Object.assign(e, nouvelle(false))
        const echelle = (e.taille / 20) * (0.85 + 0.15 * Math.sin(e.phase)) // léger scintillement
        ctx.save()
        ctx.translate(e.x, e.y)
        ctx.rotate(e.angle)
        ctx.scale(echelle, echelle)
        ctx.translate(-10, -10)
        ctx.globalAlpha = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(e.phase))
        // Doré, avec une ombre très légère pour rester visible sur le fond clair du site.
        ctx.shadowColor = 'rgba(27, 35, 26, 0.3)'
        ctx.shadowBlur = 3
        ctx.fillStyle = OR
        ctx.fill(ETOILE)
        ctx.restore()
      }
      image = requestAnimationFrame(dessiner)
    }

    dimensionner()
    dessiner()
    window.addEventListener('resize', dimensionner)
    return () => {
      cancelAnimationFrame(image)
      window.removeEventListener('resize', dimensionner)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 pointer-events-none z-40" />
}
