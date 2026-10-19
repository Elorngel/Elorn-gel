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
} from '../lib/pickupSlots'

const MODES = [
  { value: 'tout', label: 'Retrait et livraison', court: 'Fermé' },
  { value: 'livraison', label: 'Livraison seulement', court: 'Pas de livraison' },
  { value: 'retrait', label: 'Retrait seulement', court: 'Pas de retrait' },
]
const COURT = Object.fromEntries(MODES.map((m) => [m.value, m.court]))
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const CRENEAUX = { retrait: getPickupTimeSlots(), livraison: getDeliveryTimeWindows() }

function Calendrier({ mois, fermes, mode, aujourdhui, onClic }) {
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
        if (!ouvre || passe) {
          return (
            <div
              key={cle}
              className="border-r border-b border-ink/15 bg-stone/60 min-h-14 p-1 text-muted/60"
            >
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
            title={etat ? `${COURT[etat]} — cliquer pour modifier` : `Ouvert — cliquer pour fermer (${MODES.find((m) => m.value === mode).label.toLowerCase()})`}
            className={`border-r border-b border-ink/15 min-h-14 p-1 text-left align-top transition-colors ${
              etat === 'tout'
                ? 'bg-rust text-paper'
                : etat
                  ? 'bg-rust/15 text-ink'
                  : 'bg-paper hover:bg-forest/10'
            }`}
          >
            <span className="font-tag text-xs font-semibold">{d.getDate()}</span>
            {etat && (
              <span className="block font-tag text-[9px] uppercase leading-tight">{COURT[etat]}</span>
            )}
          </button>
        )
      })}
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
                  <button
                    type="button"
                    onClick={() => onJour(type, j, true)}
                    className="underline hover:text-ink"
                  >
                    tout
                  </button>{' '}
                  /{' '}
                  <button
                    type="button"
                    onClick={() => onJour(type, j, false)}
                    className="underline hover:text-ink"
                  >
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

function CalendarEditor({ initialFermes, initialIndispo, onSave }) {
  const [fermes, setFermes] = useState(initialFermes)
  const [indispo, setIndispo] = useState(initialIndispo)
  const [saved, setSaved] = useState(() => JSON.stringify([initialFermes, initialIndispo]))
  const [mode, setMode] = useState('tout')
  const [mois, setMois] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [saving, setSaving] = useState(false)
  const aujourdhui = cleDate(new Date())

  const dirty = JSON.stringify([fermes, indispo]) !== saved

  const cliquerJour = (cle) =>
    setFermes((prev) => {
      const next = { ...prev }
      if (next[cle] === mode) delete next[cle]
      else next[cle] = mode
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

  const prochains = useMemo(
    () =>
      Object.entries(fermes)
        .filter(([cle]) => cle >= aujourdhui)
        .sort(([a], [b]) => a.localeCompare(b)),
    [fermes, aujourdhui]
  )

  const enregistrer = async () => {
    setSaving(true)
    try {
      // On ne garde pas les jours passés, inutiles.
      const aGarder = Object.fromEntries(Object.entries(fermes).filter(([cle]) => cle >= aujourdhui))
      await onSave({ jours_fermes: aGarder, creneaux_indisponibles: indispo })
      setFermes(aGarder)
      setSaved(JSON.stringify([aGarder, indispo]))
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

      <h2 className="font-display text-2xl text-ink mb-1">Jours de fermeture</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Choisissez ce que vous fermez, puis cliquez sur les jours concernés. Recliquer sur un jour le
        rouvre. Le week-end est toujours fermé.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-tag text-xs uppercase text-muted">Fermer :</span>
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={`font-tag text-xs uppercase font-semibold px-3 py-1.5 border ${
              mode === m.value ? 'border-rust bg-rust text-paper' : 'border-ink/40 text-ink hover:bg-stone'
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

      <div className="grid gap-4 lg:grid-cols-[1fr_260px] mb-8">
        <div className="bg-paper border border-ink/15 p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMois((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="font-tag text-xs uppercase border border-ink/30 px-2 py-1 hover:bg-stone"
              aria-label="Mois précédent"
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
              aria-label="Mois suivant"
            >
              Suivant ›
            </button>
          </div>
          <Calendrier mois={mois} fermes={fermes} mode={mode} aujourdhui={aujourdhui} onClic={cliquerJour} />
        </div>

        <div className="bg-paper border border-ink/15 p-3">
          <p className="font-tag text-xs uppercase text-muted mb-2">Prochaines fermetures</p>
          {prochains.length === 0 ? (
            <p className="font-body text-sm text-muted">Aucune.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {prochains.map(([cle, etat]) => (
                <li key={cle} className="flex items-start justify-between gap-2 font-body text-sm">
                  <span>
                    {libelleDate(dateDepuisCle(cle))}
                    <span className="block font-tag text-[11px] text-rust">{COURT[etat]}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFermes((prev) => {
                        const next = { ...prev }
                        delete next[cle]
                        return next
                      })
                    }
                    className="font-tag text-[11px] uppercase text-muted hover:text-ink"
                  >
                    Rouvrir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="font-display text-2xl text-ink mb-1">Créneaux selon le jour de la semaine</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Décochez les créneaux qui ne sont jamais proposés ce jour-là (toutes les semaines). Un jour
        sans aucun créneau coché n'est plus proposé du tout.
      </p>
      <GrilleCreneaux
        type="livraison"
        titre="Livraison"
        indispo={indispo}
        onToggle={toggleCreneau}
        onJour={toutLeJour}
      />
      <GrilleCreneaux
        type="retrait"
        titre="Retrait au dépôt"
        indispo={indispo}
        onToggle={toggleCreneau}
        onJour={toutLeJour}
      />
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
      onSave={(changes) => updateSettings(changes)}
    />
  )
}
