import { useProducts } from '../hooks/useProducts'
import CroppableImage from './CroppableImage'
import BandeauRetrait from './BandeauRetrait'
import { urlProduit } from '../lib/adresses'
import { OR, contenuFetes, joursAvant, morceauxDate, produitsCouverture } from '../lib/fetes'
import { aujourdhuiParis } from '../../supabase/functions/_shared/calculCommande.js'

// Bannière « Le menu des fêtes » (maquette validée par Romuald le 13/11/2026) : remplace la bannière habituelle
// de l'accueil quand l'admin coche « Mode fêtes » (onglet Fêtes). Contenu réglable : parametres_site.fetes.
// `apercu` : affichage dans l'admin (dates passées gardées, pour pouvoir relire le texte).

const ETOILE = 'M10 0 L11.6 8.4 L20 10 L11.6 11.6 L10 20 L8.4 11.6 L0 10 L8.4 8.4 Z'
const COINS =
  'polygon(18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px),0 18px)'
const ARCS =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'%3E%3Cg fill='none' stroke='%23d9b86a' stroke-width='1'%3E%3Cpath d='M0 40 A40 40 0 0 1 80 40'/%3E%3Cpath d='M10 40 A30 30 0 0 1 70 40'/%3E%3Cpath d='M20 40 A20 20 0 0 1 60 40'/%3E%3Cpath d='M30 40 A10 10 0 0 1 50 40'/%3E%3C/g%3E%3C/svg%3E\")"

// Petites étoiles dorées dispersées autour de la carte (gauche, haut, taille, opacité) ; les * seulement sur grand écran.
const ETOILES = [
  [3, 6, 12, 0.9],
  [74, 5, 18, 1, true],
  [79, 23, 8, 0.7, true],
  [4, 83, 16, 1],
  [78, 89, 10, 0.8],
  [33, 3, 8, 0.6, true],
  [56, 92, 12, 0.9, true],
]

function Etoile({ style, className = '' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={`pointer-events-none ${className}`} style={style}>
      <path d={ETOILE} fill={OR} />
    </svg>
  )
}

function Tuile({ produit, phrase, nom }) {
  return (
    <a href={urlProduit(produit)} className="group relative block aspect-square overflow-hidden bg-stone">
      <CroppableImage
        src={produit.photo_url}
        alt={nom || produit.nom}
        loading="eager"
        zoom={produit.photo_zoom ?? 1}
        posX={produit.photo_pos_x ?? 50}
        posY={produit.photo_pos_y ?? 50}
        className="transition-transform duration-500"
      />
      <span
        className="absolute inset-x-0 bottom-0 h-[60%] lg:h-[38%]"
        style={{ background: 'linear-gradient(180deg,rgba(19,38,25,0) 0%,rgba(19,38,25,.5) 50%,rgba(19,38,25,.85) 100%)' }}
      />
      <span className="absolute left-2.5 right-2 bottom-2.5 lg:left-3.5 lg:right-3 lg:bottom-3 text-paper">
        {phrase && (
          <small className="block font-tag font-bold text-[9px] lg:text-[10px] uppercase tracking-[1px] lg:tracking-[2px]" style={{ color: OR }}>
            ✦ {phrase}
          </small>
        )}
        <b className="block font-body font-normal text-[13px] lg:text-sm leading-tight mt-0.5 text-paper/95 group-hover:underline">
          {nom || produit.nom}
        </b>
      </span>
    </a>
  )
}

export function DatesFetes({ titre, dates, apercu = false }) {
  const aujourdhui = aujourdhuiParis()
  const liste = (dates || []).filter((d) => morceauxDate(d.date) && (apercu || d.date >= aujourdhui))
  if (!liste.length) return null
  return (
    <section className="max-w-6xl mx-auto px-5 pt-7">
      <h2 className="font-display text-4xl sm:text-[44px] leading-none text-ink mb-3 flex items-center gap-3.5">
        {titre}
        <span className="flex-1 h-px" style={{ background: OR }} />
      </h2>
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {liste.map((d, i) => {
          const m = morceauxDate(d.date)
          return (
            <div key={i} className="relative bg-paper border border-ink/15 grid grid-cols-[86px_1fr]">
              <Etoile className="absolute top-2 right-2.5 w-3 h-3" />
              <div className="bg-forest text-paper text-center py-2.5 border-b-4" style={{ borderColor: OR }}>
                <small className="block font-tag font-bold text-[10px] uppercase tracking-wide">{m.jour}</small>
                <b className="block font-display text-[44px] leading-none font-normal">{m.num}</b>
                <small className="block font-tag font-bold text-[10px] uppercase tracking-wide">{m.mois}</small>
              </div>
              <div className="px-3.5 py-3 pr-6 font-body text-sm text-ink">
                <strong className="block font-tag font-bold text-[13px] uppercase mb-0.5">{d.titre}</strong>
                {d.texte}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function HeroFetes({ contenu: brut, apercu = false }) {
  const c = contenuFetes(brut)
  const { products } = useProducts({ leger: true })
  const tuiles = produitsCouverture(c)
    .map((t) => ({ ...t, produit: products.find((p) => p.id === t.id) }))
    .filter((t) => t.produit && t.produit.photo_url && (apercu || t.produit.actif !== false))
  const jours = joursAvant(c.date_cible, aujourdhuiParis())
  const chiffres = jours > 0 ? String(jours).padStart(2, '0').split('') : []

  return (
    <>
      <section
        className={`relative overflow-hidden bg-forest grid grid-cols-1 border-b border-ink/15 ${
          tuiles.length ? 'lg:grid-cols-[1fr_auto] lg:h-[528px]' : 'lg:min-h-[528px]'
        } items-center`}
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: ARCS, backgroundSize: '80px 40px' }} />

        <div className="relative px-4 py-10 sm:px-8 lg:py-0 h-full flex items-center justify-center">
          {ETOILES.map(([g, h, t, o, large], i) => (
            <Etoile
              key={i}
              className={`absolute ${large ? 'hidden lg:block' : ''}`}
              style={{ left: `${g}%`, top: `${h}%`, width: t, height: t, opacity: o }}
            />
          ))}

          <div className="relative z-10 w-full max-w-[560px] bg-paper px-6 pt-10 pb-9 sm:px-11" style={{ clipPath: COINS }}>
            <span className="absolute inset-2.5 border pointer-events-none" style={{ borderColor: OR, clipPath: COINS }} />
            <Etoile className="absolute top-4 left-[calc(50%-11px)] w-[22px] h-[22px]" />
            {c.sur && (
              <p className="font-tag font-bold text-[11px] uppercase tracking-[5px] text-rust text-center">{c.sur}</p>
            )}
            <h1 className="font-display text-5xl sm:text-[72px] leading-[0.95] tracking-wide text-forest text-center mt-2.5 mb-1.5">
              {c.titre}
            </h1>
            <div className="flex items-center justify-center gap-3 text-sm" style={{ color: OR }}>
              <span className="w-12 sm:w-20 h-px" style={{ background: OR }} />✦
              <span className="w-12 sm:w-20 h-px" style={{ background: OR }} />
            </div>
            {c.texte && (
              <p className="font-body text-[15px] leading-relaxed text-center mt-3" style={{ color: '#4c5248' }}>
                {c.texte}
              </p>
            )}
            {chiffres.length > 0 && (
              <div className="flex gap-1.5 justify-center mt-5" aria-label={`Plus que ${jours} jour${jours > 1 ? 's' : ''}`}>
                {['J', '-', ...chiffres].map((x, i) => (
                  <b
                    key={i}
                    aria-hidden="true"
                    className="bg-forest text-paper font-display font-normal text-[46px] leading-[60px] w-12 text-center"
                  >
                    {x}
                  </b>
                ))}
              </div>
            )}
            {c.bouton && (
              <a
                href={c.lien || '/fetes'}
                className="block w-fit mx-auto mt-5 bg-rust text-paper font-tag font-bold text-[13px] uppercase tracking-wide px-[22px] py-[13px] hover:bg-rust/90 transition-colors"
              >
                {c.bouton}
              </a>
            )}
          </div>
        </div>

        {tuiles.length > 0 && (
          <div className="relative grid grid-cols-2 gap-1 p-1 lg:grid-cols-[258px_258px] lg:auto-rows-[258px]">
            {tuiles.map((t) => (
              <Tuile key={t.id} produit={t.produit} phrase={t.phrase} nom={t.nom} />
            ))}
          </div>
        )}
      </section>
      {!apercu && <BandeauRetrait />}
      <DatesFetes titre={c.dates_titre} dates={c.dates} apercu={apercu} />
    </>
  )
}
