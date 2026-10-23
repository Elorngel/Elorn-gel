import { useCallback, useEffect, useRef, useState } from 'react'

// Roue de la carte privilège — ESSAI (octobre 2026), accessible seulement depuis l'admin (#admin/roue).
// Reprise fidèle du prototype roue-bontin.html : mêmes cases, même tirage pondéré (quota du jour et
// stock), mêmes réglages. Les données restent dans le navigateur (localStorage) de chaque appareil :
// rien n'est enregistré dans la base pour cet essai.

const CLE = 'bontin-roue-v3'
const COULEURS = {
  offerte: { color: '#a34428', ink: '#fbfaf6' },
  perdu: { color: '#e7e2d3', ink: '#1b231a' },
  remise10: { color: '#23422b', ink: '#fbfaf6' },
  lot: { color: '#fbfaf6', ink: '#1b231a' },
  produit: { color: '#1b231a', ink: '#fbfaf6' },
}
const DEFAUT = {
  limitMonthly: false,
  history: [],
  prizes: [
    { id: 'offerte', label: 'Commande offerte', win: true, weight: 5, maxDay: 1, stock: null, sub: 'Toute la commande est offerte.' },
    { id: 'perdu', label: 'Perdu', win: false, weight: 60, maxDay: null, stock: null, sub: 'Pas de chance cette fois. À la prochaine !' },
    { id: 'remise10', label: '10 % le mois prochain', win: true, weight: 20, maxDay: 1, stock: null, sub: 'À utiliser sur la prochaine commande, le mois prochain.' },
    { id: 'lot', label: 'Un Air Fryer', win: true, weight: 5, maxDay: 1, stock: null, sub: 'Vous gagnez un Air Fryer !' },
    { id: 'produit', label: '1 boîte de cônes offerte', win: true, weight: 10, maxDay: 1, stock: null, sub: 'Une boîte de cônes offerte !' },
  ],
}

const pad = (n) => (n < 10 ? '0' : '') + n
const cleJour = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const cleMois = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const hasard = () => {
  const a = new Uint32Array(1)
  window.crypto.getRandomValues(a)
  return a[0] / 4294967296
}

function charger() {
  try {
    const o = JSON.parse(localStorage.getItem(CLE))
    if (o && o.prizes && o.prizes.length === 5) return { ...o, history: o.history || [] }
  } catch {
    // stockage indisponible ou illisible : valeurs d'exemple
  }
  return JSON.parse(JSON.stringify(DEFAUT))
}

function enregistrer(etat) {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat))
  } catch {
    // stockage indisponible (navigation privée…) : les données vivent le temps de la page
  }
}

// --- Comptage et tirage (identique au prototype) ---
const compter = (etat, id, jour) => etat.history.filter((h) => h.id === id && (!jour || h.day === jour)).length

function disponible(etat, p) {
  if (!(p.weight > 0)) return false
  if (!p.win) return true
  if (p.maxDay != null && compter(etat, p.id, cleJour()) >= p.maxDay) return false
  if (p.stock != null && compter(etat, p.id) >= p.stock) return false
  return true
}

function tirer(etat) {
  const dispo = etat.prizes.filter((p) => disponible(etat, p))
  const total = dispo.reduce((s, p) => s + p.weight, 0)
  if (!dispo.length || total <= 0) return etat.prizes.find((p) => !p.win) || etat.prizes[0]
  const r = hasard() * total
  let cumul = 0
  for (const p of dispo) {
    cumul += p.weight
    if (r < cumul) return p
  }
  return dispo[dispo.length - 1]
}

function chances(etat) {
  const dispo = etat.prizes.filter((p) => disponible(etat, p))
  const total = dispo.reduce((s, p) => s + p.weight, 0)
  return Object.fromEntries(etat.prizes.map((p) => [p.id, total > 0 && disponible(etat, p) ? (p.weight / total) * 100 : 0]))
}

// --- Dessin de la roue ---
function couper(texte) {
  const lignes = []
  let cur = ''
  for (const mot of String(texte).split(' ')) {
    if (!cur) cur = mot
    else if ((cur + ' ' + mot).length <= 13) cur += ' ' + mot
    else {
      lignes.push(cur)
      cur = mot
    }
  }
  if (cur) lignes.push(cur)
  return lignes.slice(0, 3)
}

function dessiner(canvas, prizes) {
  const ctx = canvas.getContext('2d')
  const S = canvas.width
  const r = S / 2
  const n = prizes.length
  const seg = (2 * Math.PI) / n
  ctx.clearRect(0, 0, S, S)
  ctx.save()
  ctx.translate(r, r)
  ctx.beginPath()
  ctx.arc(0, 0, r - 2, 0, 2 * Math.PI)
  ctx.fillStyle = '#23422b'
  ctx.fill()
  const R = r - 34
  ctx.beginPath()
  ctx.arc(0, 0, R + 6, 0, 2 * Math.PI)
  ctx.fillStyle = '#fbfaf6'
  ctx.fill()
  prizes.forEach((p, i) => {
    const c = COULEURS[p.id] || { color: '#e7e2d3', ink: '#1b231a' }
    const a0 = -Math.PI / 2 + i * seg
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, R, a0, a0 + seg)
    ctx.closePath()
    ctx.fillStyle = c.color
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = '#fbfaf6'
    ctx.stroke()
    ctx.save()
    ctx.rotate(a0 + seg / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = c.ink
    ctx.font = '400 62px "Bebas Neue", Impact, "Arial Narrow", sans-serif'
    const lignes = couper(p.label.toUpperCase())
    lignes.forEach((ln, k) => ctx.fillText(ln, R - 40, (k - (lignes.length - 1) / 2) * 62))
    ctx.restore()
  })
  for (let i = 0; i < n * 3; i++) {
    const a = i * ((2 * Math.PI) / (n * 3))
    ctx.beginPath()
    ctx.arc(Math.cos(a) * (r - 18), Math.sin(a) * (r - 18), 5, 0, 2 * Math.PI)
    ctx.fillStyle = '#fbfaf6'
    ctx.fill()
  }
  ctx.restore()
}

const champ =
  'w-full bg-paper text-ink border-2 border-ink/20 px-3.5 py-3 min-h-[50px] font-body text-base font-normal normal-case tracking-normal focus:border-forest focus:outline-none disabled:opacity-40'
const etiquette = 'flex flex-col gap-1.5 font-tag text-xs font-bold uppercase tracking-[0.1em]'
const boutonLigne =
  'border-2 border-ink px-4 min-h-[44px] font-tag text-sm font-bold uppercase tracking-[0.08em] hover:bg-ink hover:text-paper'
const nombre = (v) => {
  if (v === '') return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : Math.max(0, n)
}

function Reglages({ etat, modifier, onRetour }) {
  const [copie, setCopie] = useState(null) // null | 'ok' | texte à copier à la main
  const [arme, setArme] = useState(false)
  const minuteur = useRef(null)
  const ch = chances(etat)

  useEffect(() => () => clearTimeout(minuteur.current), [])

  const majCase = (id, changes) =>
    modifier((e) => ({ ...e, prizes: e.prizes.map((p) => (p.id === id ? { ...p, ...changes } : p)) }))

  const remettreAZero = () => {
    if (arme) {
      clearTimeout(minuteur.current)
      setArme(false)
      modifier((e) => ({ ...e, history: [] }))
      return
    }
    setArme(true)
    minuteur.current = setTimeout(() => setArme(false), 4000)
  }

  const copierHistorique = async () => {
    const txt = etat.history.map((h) => [new Date(h.t).toLocaleString('fr-FR'), h.client || '', h.label].join('\t')).join('\n')
    try {
      await navigator.clipboard.writeText(txt)
      setCopie('ok')
    } catch {
      setCopie(txt)
    }
  }

  return (
    <section className="max-w-[980px] mx-auto flex flex-col gap-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h1 className="font-display text-[clamp(36px,5vw,48px)] leading-none text-ink">Réglages des lots</h1>
        <button type="button" onClick={onRetour} className={boutonLigne}>
          Retour à la roue
        </button>
      </div>

      <div className="bg-paper border border-ink/20 p-5 flex flex-col gap-3.5">
        <h2 className="font-display text-[28px] leading-none">Les cases et leurs gagnants</h2>
        <p className="font-body text-sm text-muted">
          Valeurs d'exemple à ajuster. « Chance » est un poids : plus il est grand, plus la case sort. « Gagnants max /
          jour » et « Stock total » bloquent une case une fois atteints (vide = illimité). Une case bloquée ne sort plus
          au tirage.
        </p>
        {etat.prizes.map((p, i) => {
          const c = COULEURS[p.id]
          const aujourdhui = compter(etat, p.id, cleJour())
          const total = compter(etat, p.id)
          let stat = `Aujourd'hui : ${aujourdhui}${p.maxDay != null ? ` / ${p.maxDay}` : ''} · Total : ${total}${p.stock != null ? ` / ${p.stock}` : ''}`
          stat +=
            p.weight > 0 && !disponible(etat, p)
              ? ' · quota atteint, ne sort plus'
              : ` · chance actuelle ≈ ${ch[p.id].toFixed(1).replace('.', ',')} %`
          return (
            <div
              key={p.id}
              className={`grid grid-cols-2 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] gap-3 items-end ${i ? 'pt-4 border-t border-ink/20' : ''}`}
            >
              <div className="col-span-2 md:col-span-1 flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 w-5 h-5 border-2 border-ink" style={{ background: c?.color }} />
                <label className="sr-only" htmlFor={`lab-${p.id}`}>
                  Nom de la case
                </label>
                <input
                  id={`lab-${p.id}`}
                  type="text"
                  maxLength={28}
                  defaultValue={p.label}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (!v) e.target.value = p.label
                    else if (v !== p.label) majCase(p.id, { label: v })
                  }}
                  className={champ}
                />
              </div>
              <label className={`${etiquette} text-muted`} htmlFor={`w-${p.id}`}>
                Chance
                <input
                  id={`w-${p.id}`}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={p.weight}
                  onChange={(e) => {
                    const w = parseFloat(e.target.value)
                    majCase(p.id, { weight: isNaN(w) ? 0 : Math.max(0, w) })
                  }}
                  className={champ}
                />
              </label>
              <label className={`${etiquette} text-muted`} htmlFor={`d-${p.id}`}>
                Gagnants max / jour
                <input
                  id={`d-${p.id}`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="illimité"
                  disabled={!p.win}
                  defaultValue={p.maxDay ?? ''}
                  onChange={(e) => majCase(p.id, { maxDay: nombre(e.target.value) })}
                  className={champ}
                />
              </label>
              <label className={`${etiquette} text-muted`} htmlFor={`s-${p.id}`}>
                Stock total
                <input
                  id={`s-${p.id}`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="illimité"
                  disabled={!p.win}
                  defaultValue={p.stock ?? ''}
                  onChange={(e) => majCase(p.id, { stock: nombre(e.target.value) })}
                  className={champ}
                />
              </label>
              <label className={`${etiquette} text-muted col-span-full`} htmlFor={`m-${p.id}`}>
                Message affiché au client
                <input
                  id={`m-${p.id}`}
                  type="text"
                  maxLength={90}
                  defaultValue={p.sub || ''}
                  onBlur={(e) => majCase(p.id, { sub: e.target.value.trim() })}
                  className={champ}
                />
              </label>
              <p className="col-span-full font-body text-[13px] text-muted tabular-nums">{stat}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-paper border border-ink/20 p-5 flex flex-col gap-3.5">
        <h2 className="font-display text-[28px] leading-none">Règle</h2>
        <label className="flex gap-2.5 items-center font-body font-semibold cursor-pointer" htmlFor="limit">
          <input
            id="limit"
            type="checkbox"
            checked={!!etat.limitMonthly}
            onChange={(e) => modifier((x) => ({ ...x, limitMonthly: e.target.checked }))}
            className="w-[22px] h-[22px] accent-forest"
          />
          Une seule partie par client et par mois (nom du client obligatoire)
        </label>
      </div>

      <div className="bg-paper border border-ink/20 p-5 flex flex-col gap-3.5">
        <h2 className="font-display text-[28px] leading-none">Historique des parties</h2>
        <ul className="max-h-[260px] overflow-auto font-body text-sm tabular-nums">
          {etat.history.length === 0 ? (
            <li className="py-2 text-muted">Aucune partie pour le moment.</li>
          ) : (
            etat.history.slice(0, 40).map((h) => (
              <li key={h.t + h.id} className="py-2 border-t border-ink/20 first:border-t-0 flex flex-wrap gap-2.5">
                <span className="text-muted">
                  {new Date(h.t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{h.client || '(sans nom)'}</span>
                <strong>{h.label}</strong>
              </li>
            ))
          )}
        </ul>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={copierHistorique} className={boutonLigne}>
            Copier l'historique
          </button>
          <button
            type="button"
            onClick={remettreAZero}
            className="border-2 border-rust text-rust px-4 min-h-[44px] font-tag text-sm font-bold uppercase tracking-[0.08em] hover:bg-rust hover:text-paper"
          >
            {arme ? 'Confirmer : tout effacer' : 'Remettre les compteurs à zéro'}
          </button>
        </div>
        {copie === 'ok' && <p className="font-body text-sm text-muted">Historique copié.</p>}
        {copie && copie !== 'ok' && (
          <textarea
            readOnly
            value={copie}
            onFocus={(e) => e.target.select()}
            className="w-full min-h-[120px] bg-paper border-2 border-ink/20 p-2.5 font-mono text-[13px]"
          />
        )}
      </div>
      <p className="text-center font-body text-xs text-muted">
        Essai : les données restent sur cet appareil, dans ce navigateur.
      </p>
    </section>
  )
}

export default function RouePage() {
  const [etat, setEtat] = useState(charger)
  const [vue, setVue] = useState('jeu')
  const [client, setClient] = useState('')
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [rotation, setRotation] = useState(0)
  const canvasRef = useRef(null)
  const terminerRef = useRef(null)
  const reduit = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const modifier = useCallback((f) => {
    setEtat((e) => {
      const suivant = f(e)
      enregistrer(suivant)
      return suivant
    })
  }, [])

  // La roue se redessine quand un nom de case change, et une fois la police Bebas Neue chargée.
  const libelles = etat.prizes.map((p) => p.label).join('|')
  useEffect(() => {
    if (vue !== 'jeu' || !canvasRef.current) return
    const prizes = libelles.split('|').map((label, i) => ({ id: DEFAUT.prizes[i].id, label }))
    dessiner(canvasRef.current, prizes)
    document.fonts?.load('400 62px "Bebas Neue"').then(() => canvasRef.current && dessiner(canvasRef.current, prizes), () => {})
  }, [libelles, vue])

  useEffect(() => {
    if (resultat) terminerRef.current?.focus()
  }, [resultat])

  const lancer = () => {
    if (enCours) return
    setMessage('')
    const nom = client.trim()
    if (etat.limitMonthly) {
      if (!nom) {
        setMessage('Saisissez le nom ou le n° du client.')
        return
      }
      const mois = cleMois()
      if (etat.history.some((h) => h.month === mois && String(h.client || '').toLowerCase() === nom.toLowerCase())) {
        setMessage('Ce client a déjà joué ce mois-ci.')
        return
      }
    }
    const p = tirer(etat)
    const i = etat.prizes.findIndex((x) => x.id === p.id)
    const seg = 360 / etat.prizes.length
    const centre = i * seg + seg / 2
    const ecart = (hasard() - 0.5) * seg * 0.7
    const cible = ((-(centre + ecart) % 360) + 360) % 360
    const actuel = ((rotation % 360) + 360) % 360
    setRotation(rotation + (((cible - actuel) + 360) % 360) + 360 * 5)
    const maintenant = new Date()
    modifier((e) => ({
      ...e,
      history: [
        { t: maintenant.getTime(), day: cleJour(maintenant), month: cleMois(maintenant), client: nom, id: p.id, label: p.label },
        ...e.history,
      ].slice(0, 500),
    }))
    setEnCours(true)
    setTimeout(() => setResultat(p), reduit ? 1050 : 5300)
  }

  const terminer = () => {
    setResultat(null)
    setClient('')
    setEnCours(false)
  }

  const jour = cleJour()
  const parties = etat.history.filter((h) => h.day === jour)
  const gains = parties.filter((h) => etat.prizes.find((p) => p.id === h.id)?.win).length

  return (
    <div className="min-h-screen bg-stone text-ink font-body">
      <div className="bg-ink text-stone font-tag text-xs font-medium uppercase tracking-[0.14em] px-4 py-2.5 flex justify-between gap-3">
        <span>Jeu de la carte privilège — essai</span>
        <a href="#admin" className="hover:text-paper">
          Retour à l'admin
        </a>
      </div>
      <header className="bg-paper border-b border-ink/20 px-4 py-2.5 flex justify-between items-center gap-3">
        <img src="/logo.png" alt="Bontin" className="h-11 w-auto" />
        {vue === 'jeu' && (
          <button type="button" onClick={() => setVue('reglages')} className={boutonLigne}>
            Réglages des lots
          </button>
        )}
      </header>

      <main className="px-4 pt-6 pb-9">
        {vue === 'reglages' ? (
          <Reglages etat={etat} modifier={modifier} onRetour={() => setVue('jeu')} />
        ) : (
          <section className="grid grid-cols-1 min-[820px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 min-[820px]:gap-8 items-center max-w-[1100px] mx-auto">
            <div className="pt-[18px]">
              <div className="relative w-full max-w-[540px] aspect-square mx-auto">
                <svg
                  className="absolute left-1/2 -top-4 w-[46px] h-[54px] -ml-[23px] z-[2] drop-shadow-[0_3px_3px_rgba(27,35,26,0.4)]"
                  viewBox="0 0 46 54"
                  aria-hidden="true"
                >
                  <path d="M23 52 L3 10 Q23 -4 43 10 Z" fill="#a34428" stroke="#1b231a" strokeWidth="3" strokeLinejoin="round" />
                </svg>
                <div
                  className="w-full h-full rounded-full shadow-[0_12px_32px_rgba(27,35,26,0.3)]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: reduit ? 'transform 1s ease-out' : 'transform 5.2s cubic-bezier(.12,.6,.1,1)',
                  }}
                >
                  <canvas ref={canvasRef} width="1000" height="1000" className="block w-full h-full" aria-label="Roue des gains" />
                </div>
                <button
                  type="button"
                  onClick={lancer}
                  disabled={enCours}
                  aria-label="Lancer la roue"
                  className="absolute left-1/2 top-1/2 w-[21%] aspect-square -translate-x-1/2 -translate-y-1/2 z-[2] rounded-full border-[6px] border-paper bg-ink text-paper font-display text-[clamp(26px,5.5vw,46px)] leading-none tracking-[0.06em] disabled:opacity-90"
                >
                  GO
                </button>
              </div>
            </div>

            <div className="bg-forest text-paper p-7 flex flex-col gap-3.5">
              <h1 className="font-display text-[clamp(40px,6vw,60px)] leading-[0.98]">Tentez votre chance</h1>
              <p className="opacity-90">Un tour de roue pour les clients qui ont la carte privilège.</p>
              <label className={`${etiquette} text-stone`} htmlFor="roue-client">
                Client (nom ou n° de carte)
                <input
                  id="roue-client"
                  type="text"
                  autoComplete="off"
                  placeholder="Ex. Mme Le Gall"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-paper text-ink border-2 border-paper px-3.5 py-3 min-h-[50px] font-body text-base normal-case tracking-normal font-normal focus:outline-none"
                />
              </label>
              <button
                type="button"
                onClick={lancer}
                disabled={enCours}
                className="bg-rust text-paper min-h-16 font-tag text-xl font-bold uppercase tracking-[0.1em] px-5 hover:brightness-110 disabled:opacity-55"
              >
                Lancer la roue
              </button>
              <p className="min-h-[22px] font-extrabold text-[#ffd2c4]" role="status">
                {message}
              </p>
              <p className="text-[13px] text-stone tabular-nums">
                Aujourd'hui : {parties.length} {parties.length > 1 ? 'parties' : 'partie'}, {gains} {gains > 1 ? 'gains' : 'gain'}.
              </p>
            </div>
          </section>
        )}
      </main>

      {resultat && (
        <div className="fixed inset-0 z-20 bg-ink/80 grid place-items-center p-4">
          <div
            role="dialog"
            aria-live="polite"
            className={`bg-paper text-ink border-t-8 border-rust px-6 py-8 w-full max-w-[460px] text-center flex flex-col gap-3.5 ${resultat.win && !reduit ? 'animate-[roue-pop_.5s_ease-out]' : ''}`}
          >
            <h2 className={`font-display text-[clamp(44px,9vw,64px)] leading-[0.95] ${resultat.win ? 'text-rust' : ''}`}>
              {resultat.win ? `Bravo ! ${resultat.label}` : resultat.label}
            </h2>
            <p className="text-muted text-lg">{resultat.sub}</p>
            <button
              ref={terminerRef}
              type="button"
              onClick={terminer}
              className="bg-rust text-paper min-h-16 font-tag text-xl font-bold uppercase tracking-[0.1em] px-5 hover:brightness-110"
            >
              Terminé
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
