import { useMemo, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import {
  JOURS_OUVRES,
  NOM_JOUR,
  cleDate,
  dateDepuisCle,
  libelleDate,
  getPickupTimeSlots,
  getDeliveryTimeWindows,
  joursFeries,
  creneauxDuJour,
  bornesCreneau,
  estJourFerme,
} from '../lib/pickupSlots'

const MODES = [
  { value: 'tout', label: 'Fermer retrait et livraison', court: 'Fermé' },
  { value: 'livraison', label: 'Fermer la livraison', court: 'Pas de livraison' },
  { value: 'retrait', label: 'Fermer le retrait', court: 'Pas de retrait' },
  { value: 'horaires', label: "Horaires spéciaux d'un jour", court: '' },
]
const COURT = Object.fromEntries(MODES.map((m) => [m.value, m.court]))
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const CRENEAUX = { retrait: getPickupTimeSlots(), livraison: getDeliveryTimeWindows() }
const TITRES = { livraison: 'Livraison', retrait: 'Retrait au dépôt' }

// Heures proposées pour « de … à … » : 8h00, 8h30, … 18h00.
const HEURES = Array.from({ length: 21 }, (_, i) => {
  const m = 8 * 60 + i * 30
  return { label: `${Math.floor(m / 60)}h${m % 60 === 0 ? '00' : '30'}`, minutes: m }
})

// Résumé lisible des horaires spéciaux d'un type ("Matin", "9h00 à 12h00", "Fermé"…).
function resumeHoraires(liste) {
  if (liste.length === 0) return 'fermé'
  const b = liste.map(bornesCreneau)
  const fmt = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
  return `${fmt(Math.min(...b.map((x) => x.debut)))} à ${fmt(Math.max(...b.map((x) => x.fin)))}`
}

function Calendrier({ mois, fermes, speciaux, jourEdite, aujourdhui, onClic }) {
  const premier = new Date(mois.getFullYear(), mois.getMonth(), 1)
  const decalage = (premier.getDay() + 6) % 7 // lundi en premier
  const nbJours = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate()
  const cases = [
    ...Array(decalage).fill(null),
    ...Array.from({ length: nbJours }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), i + 1)),
  ]

  return (
    <div className="grid grid-cols-7 border-l border-t border-ink/15">
      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((j) => (
        <div
          key={j}
          className="border-r border-b border-ink/15 bg-stone px-1 py-1 font-tag text-[11px] uppercase text-muted text-center"
        >
          {j}
        </div>
      ))}
      {cases.map((d, i) => {
        if (!d) return <div key={`vide-${i}`} className="border-r border-b border-ink/15 bg-stone/40" />
        const cle = cleDate(d)
        const ouvre = JOURS_OUVRES.includes(d.getDay())
        const passe = cle < aujourdhui
        const etat = fermes[cle]
        const special = speciaux[cle]
        if (!ouvre || passe) {
          return (
            <div key={cle} className="border-r border-b border-ink/15 bg-stone/60 min-h-14 p-1 text-muted/60">
              <span className="font-tag text-xs">{d.getDate()}</span>
              {!ouvre && <span className="block font-tag text-[9px] uppercase">week-end</span>}
            </div>
          )
        }
        return (
          <button
            key={cle}
            type="button"
            onClick={() => onClic(cle)}
            className={`border-r border-b border-ink/15 min-h-14 p-1 text-left align-top transition-colors ${
              jourEdite === cle ? 'outline-2 outline-forest -outline-offset-2' : ''
            } ${
              etat === 'tout'
                ? 'bg-rust text-paper'
                : etat
                  ? 'bg-rust/15 text-ink'
                  : special
                    ? 'bg-forest/15 text-ink'
                    : 'bg-paper hover:bg-forest/10'
            }`}
          >
            <span className="font-tag text-xs font-semibold">{d.getDate()}</span>
            {etat && <span className="block font-tag text-[9px] uppercase leading-tight">{COURT[etat]}</span>}
            {special && etat !== 'tout' && (
              <span className="block font-tag text-[9px] uppercase leading-tight text-forest">Horaires spéciaux</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function HorairesType({ type, cle, fermes, speciaux, indispo, onSet }) {
  const [de, setDe] = useState(8 * 60)
  const [a, setA] = useState(12 * 60)
  const special = speciaux[cle]?.[type]
  const habituels = creneauxDuJour(type, dateDepuisCle(cle).getDay(), indispo)
  const ouverts = Array.isArray(special) ? special : habituels
  const tous = CRENEAUX[type]
  const filtrer = (fn) => tous.filter((c) => fn(bornesCreneau(c)))
  const ferme = estJourFerme(type, cle, fermes)

  const bouton = (label, action, actif) => (
    <button
      type="button"
      onClick={action}
      className={`font-tag text-[11px] uppercase font-semibold px-2.5 py-1.5 border ${
        actif ? 'border-forest bg-forest text-paper' : 'border-ink/30 text-ink hover:bg-stone'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="border border-ink/15 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <p className="font-display text-lg text-ink">{TITRES[type]}</p>
        <p className="font-tag text-xs text-muted">
          {Array.isArray(special) ? `Horaires spéciaux : ${resumeHoraires(special)}` : 'Horaires habituels'}
        </p>
      </div>
      {ferme && (
        <p className="font-body text-xs text-rust mb-2">
          Ce jour est fermé ({type === 'retrait' ? 'retrait' : 'livraison'}) : rouvrez-le dans le calendrier
          pour que ces horaires s'appliquent.
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {bouton('Horaires habituels', () => onSet(type, null), !Array.isArray(special))}
        {bouton('Matin (avant 12h)', () => onSet(type, filtrer((b) => b.fin <= 12 * 60)))}
        {bouton('Après-midi (dès 14h)', () => onSet(type, filtrer((b) => b.debut >= 14 * 60)))}
        {bouton('Fermé ce jour', () => onSet(type, []), Array.isArray(special) && special.length === 0)}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3 font-tag text-xs">
        <span className="uppercase text-muted">De</span>
        <select
          value={de}
          onChange={(e) => setDe(Number(e.target.value))}
          className="border border-ink/20 p-1 bg-paper"
          aria-label={`${TITRES[type]} : heure de début`}
        >
          {HEURES.slice(0, -1).map((h) => (
            <option key={h.minutes} value={h.minutes}>{h.label}</option>
          ))}
        </select>
        <span className="uppercase text-muted">à</span>
        <select
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="border border-ink/20 p-1 bg-paper"
          aria-label={`${TITRES[type]} : heure de fin`}
        >
          {HEURES.slice(1).map((h) => (
            <option key={h.minutes} value={h.minutes}>{h.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onSet(type, filtrer((b) => b.debut >= de && b.fin <= a))}
          className="font-tag text-[11px] uppercase font-semibold px-2.5 py-1 border border-ink/30 hover:bg-stone"
        >
          Appliquer
        </button>
        {type === 'livraison' && (
          <span className="normal-case text-muted">(seuls les créneaux entièrement compris sont gardés)</span>
        )}
      </div>
      <div className={`grid gap-x-3 gap-y-1 ${type === 'retrait' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {tous.map((c) => (
          <label key={c} className="flex items-center gap-1.5 font-tag text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={ouverts.includes(c)}
              onChange={() =>
                onSet(type, tous.filter((x) => (x === c ? !ouverts.includes(c) : ouverts.includes(x))))
              }
              className="w-3.5 h-3.5 accent-forest"
            />
            {c}
          </label>
        ))}
      </div>
    </div>
  )
}

function GrilleCreneaux({ type, titre, indispo, onToggle, onJour }) {
  return (
    <div className="bg-paper border border-ink/15 mb-4 overflow-x-auto">
      <p className="px-3 py-2 border-b border-ink/15 font-display text-xl text-ink">{titre}</p>
      <table className="text-sm">
        <thead>
          <tr className="font-tag text-[11px] uppercase text-muted">
            <th className="px-3 py-2 text-left">Créneau</th>
            {JOURS_OUVRES.map((j) => (
              <th key={j} className="px-2 py-2 text-center">
                {NOM_JOUR(j)}
                <span className="block normal-case font-normal">
                  <button type="button" onClick={() => onJour(type, j, true)} className="underline hover:text-ink">
                    tout
                  </button>{' '}
                  /{' '}
                  <button type="button" onClick={() => onJour(type, j, false)} className="underline hover:text-ink">
                    rien
                  </button>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRENEAUX[type].map((c) => (
            <tr key={c} className="border-t border-ink/10">
              <td className="px-3 py-1.5 font-tag text-xs whitespace-nowrap">{c}</td>
              {JOURS_OUVRES.map((j) => {
                const bloque = (indispo[type]?.[String(j)] || []).includes(c)
                return (
                  <td key={j} className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={!bloque}
                      onChange={() => onToggle(type, j, c)}
                      aria-label={`${c} le ${NOM_JOUR(j).toLowerCase()}`}
                      className="w-4 h-4 accent-forest"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CalendarEditor({ initialFermes, initialIndispo, initialSpeciaux, onSave }) {
  const [fermes, setFermes] = useState(initialFermes)
  const [indispo, setIndispo] = useState(initialIndispo)
  const [speciaux, setSpeciaux] = useState(initialSpeciaux)
  const [saved, setSaved] = useState(() => JSON.stringify([initialFermes, initialIndispo, initialSpeciaux]))
  const [mode, setMode] = useState('tout')
  const [jourEdite, setJourEdite] = useState(null)
  const [mois, setMois] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [saving, setSaving] = useState(false)
  const aujourdhui = cleDate(new Date())

  const dirty = JSON.stringify([fermes, indispo, speciaux]) !== saved

  const cliquerJour = (cle) => {
    if (mode === 'horaires') {
      setJourEdite(cle)
      return
    }
    setFermes((prev) => {
      const next = { ...prev }
      if (next[cle] === mode) delete next[cle]
      else next[cle] = mode
      return next
    })
  }

  const choisirMode = (m) => {
    setMode(m)
    if (m !== 'horaires') setJourEdite(null)
  }

  // liste = créneaux ouverts ce jour-là pour ce type ; null = revenir aux horaires habituels.
  const definirHoraires = (cle, type, liste) =>
    setSpeciaux((prev) => {
      const jour = { ...(prev[cle] || {}) }
      if (liste === null) delete jour[type]
      else jour[type] = liste
      const next = { ...prev }
      if (Object.keys(jour).length === 0) delete next[cle]
      else next[cle] = jour
      return next
    })

  const fermerFeries = () => {
    const annee = mois.getFullYear()
    const feries = [...joursFeries(annee), ...joursFeries(annee + 1)].filter((f) => {
      const d = dateDepuisCle(f.cle)
      return f.cle >= aujourdhui && JOURS_OUVRES.includes(d.getDay())
    })
    setFermes((prev) => {
      const next = { ...prev }
      feries.forEach((f) => {
        next[f.cle] = 'tout'
      })
      return next
    })
  }

  const toggleCreneau = (type, jour, creneau) =>
    setIndispo((prev) => {
      const liste = prev[type]?.[String(jour)] || []
      const nouvelle = liste.includes(creneau) ? liste.filter((c) => c !== creneau) : [...liste, creneau]
      return { ...prev, [type]: { ...(prev[type] || {}), [String(jour)]: nouvelle } }
    })

  const toutLeJour = (type, jour, ouvert) =>
    setIndispo((prev) => ({
      ...prev,
      [type]: { ...(prev[type] || {}), [String(jour)]: ouvert ? [] : [...CRENEAUX[type]] },
    }))

  // Jours à venir qui sortent de l'ordinaire (fermés ou avec des horaires spéciaux).
  const prochains = useMemo(() => {
    const cles = new Set([...Object.keys(fermes), ...Object.keys(speciaux)])
    return [...cles].filter((cle) => cle >= aujourdhui).sort()
  }, [fermes, speciaux, aujourdhui])

  const enregistrer = async () => {
    setSaving(true)
    try {
      const futur = (obj) => Object.fromEntries(Object.entries(obj).filter(([cle]) => cle >= aujourdhui))
      const f = futur(fermes)
      const s = futur(speciaux)
      await onSave({ jours_fermes: f, creneaux_indisponibles: indispo, horaires_speciaux: s })
      setFermes(f)
      setSpeciaux(s)
      setSaved(JSON.stringify([f, indispo, s]))
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-paper border border-ink/15 px-3 py-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-sm text-muted">
          Les clients ne voient que les jours et créneaux ouverts.
          {dirty && <span className="font-tag text-rust ml-3">modifications non enregistrées</span>}
        </p>
        <button
          type="button"
          onClick={enregistrer}
          disabled={!dirty || saving}
          className="font-tag text-xs uppercase font-semibold bg-forest text-paper px-4 py-1.5 hover:bg-ink disabled:bg-muted disabled:cursor-not-allowed"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer le calendrier'}
        </button>
      </div>

      <h2 className="font-display text-2xl text-ink mb-1">Jours particuliers</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Choisissez une action, puis cliquez sur les jours concernés. Pour fermer : recliquer sur un jour le
        rouvre. Pour des horaires spéciaux : cliquez sur le jour, puis réglez ses horaires sous le calendrier.
        Le week-end est toujours fermé.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => choisirMode(m.value)}
            className={`font-tag text-xs uppercase font-semibold px-3 py-1.5 border ${
              mode === m.value
                ? m.value === 'horaires'
                  ? 'border-forest bg-forest text-paper'
                  : 'border-rust bg-rust text-paper'
                : 'border-ink/40 text-ink hover:bg-stone'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          onClick={fermerFeries}
          className="ml-auto font-tag text-xs uppercase font-semibold px-3 py-1.5 border border-forest text-forest hover:bg-forest hover:text-paper"
        >
          Fermer les jours fériés
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px] mb-4">
        <div className="bg-paper border border-ink/15 p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMois((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="font-tag text-xs uppercase border border-ink/30 px-2 py-1 hover:bg-stone"
            >
              ‹ Précédent
            </button>
            <p className="font-display text-xl text-ink">
              {MOIS[mois.getMonth()]} {mois.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setMois((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="font-tag text-xs uppercase border border-ink/30 px-2 py-1 hover:bg-stone"
            >
              Suivant ›
            </button>
          </div>
          <Calendrier
            mois={mois}
            fermes={fermes}
            speciaux={speciaux}
            jourEdite={jourEdite}
            aujourdhui={aujourdhui}
            onClic={cliquerJour}
          />
        </div>

        <div className="bg-paper border border-ink/15 p-3">
          <p className="font-tag text-xs uppercase text-muted mb-2">Prochains jours particuliers</p>
          {prochains.length === 0 ? (
            <p className="font-body text-sm text-muted">Aucun.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {prochains.map((cle) => (
                <li key={cle} className="flex items-start justify-between gap-2 font-body text-sm">
                  <span>
                    {libelleDate(dateDepuisCle(cle))}
                    {fermes[cle] && <span className="block font-tag text-[11px] text-rust">{COURT[fermes[cle]]}</span>}
                    {speciaux[cle] &&
                      Object.entries(speciaux[cle]).map(([type, liste]) => (
                        <span key={type} className="block font-tag text-[11px] text-forest">
                          {TITRES[type]} : {resumeHoraires(liste)}
                        </span>
                      ))}
                  </span>
                  <span className="flex flex-col items-end gap-1 shrink-0">
                    {speciaux[cle] && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('horaires')
                          setJourEdite(cle)
                        }}
                        className="font-tag text-[11px] uppercase text-muted hover:text-ink"
                      >
                        Modifier
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFermes((prev) => {
                          const next = { ...prev }
                          delete next[cle]
                          return next
                        })
                        setSpeciaux((prev) => {
                          const next = { ...prev }
                          delete next[cle]
                          return next
                        })
                        if (jourEdite === cle) setJourEdite(null)
                      }}
                      className="font-tag text-[11px] uppercase text-muted hover:text-ink"
                    >
                      Remettre normal
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {jourEdite && (
        <div className="bg-paper border-2 border-forest p-3 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-display text-xl text-ink">
              Horaires du {libelleDate(dateDepuisCle(jourEdite)).toLowerCase()}
            </h3>
            <button
              type="button"
              onClick={() => setJourEdite(null)}
              className="font-tag text-xs uppercase text-muted hover:text-ink"
            >
              Fermer ce réglage
            </button>
          </div>
          <div className="grid gap-3">
            {['livraison', 'retrait'].map((type) => (
              <HorairesType
                key={`${jourEdite}-${type}`}
                type={type}
                cle={jourEdite}
                fermes={fermes}
                speciaux={speciaux}
                indispo={indispo}
                onSet={(t, liste) => definirHoraires(jourEdite, t, liste)}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display text-2xl text-ink mb-1 mt-8">Créneaux habituels selon le jour de la semaine</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Décochez les créneaux qui ne sont jamais proposés ce jour-là (toutes les semaines). Un jour sans
        aucun créneau coché n'est plus proposé du tout. Les horaires spéciaux d'un jour passent avant.
      </p>
      <GrilleCreneaux type="livraison" titre="Livraison" indispo={indispo} onToggle={toggleCreneau} onJour={toutLeJour} />
      <GrilleCreneaux type="retrait" titre="Retrait au dépôt" indispo={indispo} onToggle={toggleCreneau} onJour={toutLeJour} />
    </div>
  )
}

export default function CalendarPanel() {
  const { settings, loading, updateSettings } = useSiteSettings()
  if (loading || !settings) return <p className="font-body text-sm text-muted">Chargement…</p>
  return (
    <CalendarEditor
      initialFermes={settings.jours_fermes || {}}
      initialIndispo={settings.creneaux_indisponibles || { retrait: {}, livraison: {} }}
      initialSpeciaux={settings.horaires_speciaux || {}}
      onSave={(changes) => updateSettings(changes)}
    />
  )
}
