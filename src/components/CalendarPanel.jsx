import { useMemo, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import {
  JOURS_OUVRES,
  NOM_JOUR,
  cleDate,
  dateDepuisCle,
  libelleDate,
  joursFeries,
  creneauxDuJour,
  bornesCreneau,
  TOUS_CRENEAUX,
} from '../lib/pickupSlots'

// Calendrier de l'admin (refait le 04/11/2026 pour être plus simple) :
// 1. « Semaine type » : les horaires proposés d'office chaque lundi, mardi… (colonne creneaux_indisponibles) ;
// 2. calendrier : pour une date précise, on change ces horaires ou on ferme (colonne horaires_speciaux,
//    où une liste vide = fermé). Les anciens « jours fermés » (jours_fermes) sont repris dans horaires_speciaux.

const TYPES = [
  { cle: 'livraison', titre: 'Livraison', court: 'Liv.' },
  { cle: 'retrait', titre: 'Retrait au dépôt', court: 'Ret.' },
]
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const CHOIX = [
  { cle: 'journee', label: 'Toute la journée' },
  { cle: 'matin', label: 'Le matin seulement' },
  { cle: 'apresmidi', label: "L'après-midi seulement" },
  { cle: 'ferme', label: 'Fermé' },
  { cle: 'perso', label: 'Personnalisé (choisir les créneaux)…' },
]

function creneauxDuChoix(type, choix) {
  const tous = TOUS_CRENEAUX[type]
  if (choix === 'journee') return [...tous]
  if (choix === 'matin') return tous.filter((c) => bornesCreneau(c).fin <= 12 * 60)
  if (choix === 'apresmidi') return tous.filter((c) => bornesCreneau(c).debut >= 14 * 60)
  return []
}

const memes = (a, b) => a.length === b.length && a.every((x) => b.includes(x))

function choixDe(type, liste) {
  for (const c of ['journee', 'matin', 'apresmidi', 'ferme']) if (memes(liste, creneauxDuChoix(type, c))) return c
  return 'perso'
}

const fmt = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`

// Les plages horaires : « 9h00 à 12h00 et 14h00 à 18h00 », ou « Fermé ».
function heures(type, liste) {
  if (liste.length === 0) return 'Fermé'
  const plages = []
  TOUS_CRENEAUX[type]
    .filter((c) => liste.includes(c))
    .map(bornesCreneau)
    .forEach((b) => {
      const derniere = plages[plages.length - 1]
      if (derniere && derniere.fin === b.debut) derniere.fin = b.fin
      else plages.push({ ...b })
    })
  return plages.map((p) => `${fmt(p.debut)} à ${fmt(p.fin)}`).join(' et ')
}

// « Toute la journée », « Fermé », ou les plages.
const resume = (type, liste) =>
  liste.length && memes(liste, TOUS_CRENEAUX[type]) ? 'Toute la journée' : heures(type, liste)

const resumeCourt = (type, liste) => resume(type, liste).replace(/h00/g, 'h').replace(/ à /g, '–')

// Menu « Toute la journée / Matin / Après-midi / Fermé / Personnalisé » (+ « Comme d'habitude » pour une date).
function ChoixHoraires({ type, liste, onChange, habituel = null }) {
  const [persoOuvert, setPersoOuvert] = useState(false)
  const courant = habituel && liste === null ? 'habitude' : choixDe(type, liste ?? [])
  const affiche = liste ?? habituel ?? []
  const montrerCases = persoOuvert || courant === 'perso'

  return (
    <div>
      <select
        value={montrerCases && courant !== 'habitude' ? 'perso' : courant}
        onChange={(e) => {
          const v = e.target.value
          if (v === 'perso') {
            setPersoOuvert(true)
            onChange([...affiche])
            return
          }
          setPersoOuvert(false)
          onChange(v === 'habitude' ? null : creneauxDuChoix(type, v))
        }}
        className="w-full border border-ink/30 bg-paper p-2 font-body text-sm focus:border-forest focus:outline-none"
      >
        {habituel && <option value="habitude">Comme d'habitude ({resume(type, habituel).toLowerCase()})</option>}
        {CHOIX.map((c) => (
          <option key={c.cle} value={c.cle}>
            {c.label}
          </option>
        ))}
      </select>
      <p className={`mt-1 font-tag text-xs ${affiche.length === 0 ? 'text-rust' : 'text-forest'}`}>
        {heures(type, affiche)}
      </p>
      {montrerCases && (
        <div
          className={`mt-2 grid gap-x-3 gap-y-1 border border-ink/15 p-2 ${type === 'retrait' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}
        >
          {TOUS_CRENEAUX[type].map((c) => (
            <label key={c} className="flex items-center gap-1.5 font-tag text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={affiche.includes(c)}
                onChange={() =>
                  onChange(TOUS_CRENEAUX[type].filter((x) => (x === c ? !affiche.includes(c) : affiche.includes(x))))
                }
                className="w-3.5 h-3.5 accent-forest"
              />
              {c}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function Calendrier({ mois, speciaux, jourEdite, aujourdhui, onClic }) {
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
        <div key={j} className="border-r border-b border-ink/15 bg-stone px-1 py-1 font-tag text-[11px] uppercase text-muted text-center">
          {j}
        </div>
      ))}
      {cases.map((d, i) => {
        if (!d) return <div key={`vide-${i}`} className="border-r border-b border-ink/15 bg-stone/40" />
        const cle = cleDate(d)
        const ouvre = JOURS_OUVRES.includes(d.getDay())
        if (!ouvre || cle < aujourdhui) {
          return (
            <div key={cle} className="border-r border-b border-ink/15 bg-stone/60 min-h-16 p-1 text-muted/60">
              <span className="font-tag text-xs">{d.getDate()}</span>
              {!ouvre && <span className="block font-tag text-[9px] uppercase">week-end</span>}
            </div>
          )
        }
        const lignes = TYPES.map((t) => ({ ...t, liste: speciaux[cle]?.[t.cle] })).filter((t) => Array.isArray(t.liste))
        const toutFerme = lignes.length === 2 && lignes.every((t) => t.liste.length === 0)
        return (
          <button
            key={cle}
            type="button"
            onClick={() => onClic(cle)}
            className={`border-r border-b border-ink/15 min-h-16 p-1 text-left align-top transition-colors ${
              jourEdite === cle ? 'outline-2 outline-forest -outline-offset-2' : ''
            } ${toutFerme ? 'bg-rust text-paper' : lignes.length ? 'bg-[#f3e6d0] text-ink' : 'bg-paper hover:bg-forest/10'}`}
          >
            <span className="font-tag text-xs font-semibold">{d.getDate()}</span>
            {toutFerme ? (
              <span className="block font-tag text-[10px] uppercase leading-tight">Fermé</span>
            ) : (
              lignes.map((t) => (
                <span
                  key={t.cle}
                  className={`block font-tag text-[9px] leading-tight ${t.liste.length === 0 ? 'text-rust font-semibold' : 'text-ink'}`}
                >
                  {t.court} {resumeCourt(t.cle, t.liste)}
                </span>
              ))
            )}
          </button>
        )
      })}
    </div>
  )
}

function CalendarEditor({ initialIndispo, initialSpeciaux, onSave }) {
  const [indispo, setIndispo] = useState(initialIndispo)
  const [speciaux, setSpeciaux] = useState(initialSpeciaux)
  const [saved, setSaved] = useState(() => JSON.stringify([initialIndispo, initialSpeciaux]))
  const [jourEdite, setJourEdite] = useState(null)
  const [periode, setPeriode] = useState({ du: '', au: '', quoi: 'tout' })
  const [mois, setMois] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [saving, setSaving] = useState(false)
  const aujourdhui = cleDate(new Date())
  const dirty = JSON.stringify([indispo, speciaux]) !== saved

  const habituel = (type, cle) => creneauxDuJour(type, dateDepuisCle(cle).getDay(), indispo)

  // Semaine type : liste des créneaux ouverts d'office ce jour de la semaine.
  const definirSemaine = (type, jour, liste) =>
    setIndispo((prev) => ({
      ...prev,
      [type]: { ...(prev[type] || {}), [String(jour)]: TOUS_CRENEAUX[type].filter((c) => !liste.includes(c)) },
    }))

  // Une date : liste des créneaux ouverts ce jour-là ; null = comme d'habitude.
  const definirJour = (cle, type, liste) =>
    setSpeciaux((prev) => {
      const jour = { ...(prev[cle] || {}) }
      if (liste === null || memes(liste, habituel(type, cle))) delete jour[type]
      else jour[type] = liste
      const next = { ...prev }
      if (Object.keys(jour).length === 0) delete next[cle]
      else next[cle] = jour
      return next
    })

  const fermer = (cles, quoi) =>
    setSpeciaux((prev) => {
      const next = { ...prev }
      cles.forEach((cle) => {
        next[cle] = {
          ...(next[cle] || {}),
          ...(quoi !== 'retrait' ? { livraison: [] } : {}),
          ...(quoi !== 'livraison' ? { retrait: [] } : {}),
        }
      })
      return next
    })

  const fermerFeries = () => {
    const annee = mois.getFullYear()
    fermer(
      [...joursFeries(annee), ...joursFeries(annee + 1)]
        .map((f) => f.cle)
        .filter((cle) => cle >= aujourdhui && JOURS_OUVRES.includes(dateDepuisCle(cle).getDay())),
      'tout'
    )
  }

  const fermerPeriode = () => {
    if (!periode.du || !periode.au || periode.au < periode.du) return
    const cles = []
    for (let d = dateDepuisCle(periode.du); cleDate(d) <= periode.au; d.setDate(d.getDate() + 1)) {
      if (JOURS_OUVRES.includes(d.getDay()) && cleDate(d) >= aujourdhui) cles.push(cleDate(d))
    }
    fermer(cles, periode.quoi)
    setPeriode({ du: '', au: '', quoi: 'tout' })
  }

  const prochains = useMemo(() => Object.keys(speciaux).filter((cle) => cle >= aujourdhui).sort(), [speciaux, aujourdhui])

  const enregistrer = async () => {
    setSaving(true)
    try {
      const s = Object.fromEntries(Object.entries(speciaux).filter(([cle]) => cle >= aujourdhui))
      // Les fermetures sont désormais toutes dans horaires_speciaux : l'ancienne colonne est vidée.
      await onSave({ jours_fermes: {}, creneaux_indisponibles: indispo, horaires_speciaux: s })
      setSpeciaux(s)
      setSaved(JSON.stringify([indispo, s]))
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const champDate = 'border border-ink/30 bg-paper p-1.5 font-body text-sm focus:border-forest focus:outline-none'

  return (
    <div>
      <div className="sticky top-0 z-10 bg-paper border border-ink/15 px-3 py-2 mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-sm text-muted">
          Les clients ne voient que les jours et créneaux ouverts. Le week-end est toujours fermé.
          {dirty && <span className="font-tag text-rust ml-3">modifications non enregistrées</span>}
        </p>
        <button
          type="button"
          onClick={enregistrer}
          disabled={!dirty || saving}
          className="font-tag text-xs uppercase font-semibold bg-forest text-paper px-4 py-2 hover:bg-ink disabled:bg-muted disabled:cursor-not-allowed"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer le calendrier'}
        </button>
      </div>

      {/* 1. Semaine type */}
      <h2 className="font-display text-2xl text-ink mb-1">1. La semaine type</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Ce qui est proposé d'office aux clients, chaque semaine. Un jour « Fermé » n'est plus proposé du tout.
      </p>
      <div className="bg-paper border border-ink/15 mb-8 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="font-tag text-[11px] uppercase text-muted border-b border-ink/15">
              <th className="px-3 py-2 text-left w-28">Jour</th>
              {TYPES.map((t) => (
                <th key={t.cle} className="px-3 py-2 text-left">
                  {t.titre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {JOURS_OUVRES.map((j) => (
              <tr key={j} className="border-b border-ink/10 last:border-b-0 align-top">
                <td className="px-3 py-3 font-display text-lg text-ink">{NOM_JOUR(j)}</td>
                {TYPES.map((t) => (
                  <td key={t.cle} className="px-3 py-3">
                    <ChoixHoraires
                      type={t.cle}
                      liste={creneauxDuJour(t.cle, j, indispo)}
                      onChange={(liste) => definirSemaine(t.cle, j, liste)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. Jours particuliers */}
      <h2 className="font-display text-2xl text-ink mb-1">2. Les jours particuliers</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Cliquez sur un jour pour changer ses horaires ou le fermer. Les cases colorées sont celles qui ne suivent pas
        la semaine type.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <button
          type="button"
          onClick={fermerFeries}
          className="font-tag text-xs uppercase font-semibold px-3 py-2 border border-forest text-forest hover:bg-forest hover:text-paper"
        >
          Fermer les jours fériés
        </button>
        <div className="flex flex-wrap items-end gap-2 border border-ink/15 bg-paper px-3 py-2">
          <span className="font-tag text-xs uppercase text-muted self-center">Fermer une période :</span>
          <label className="font-tag text-[11px] uppercase text-muted">
            du
            <input type="date" value={periode.du} onChange={(e) => setPeriode({ ...periode, du: e.target.value })} className={`${champDate} ml-1`} />
          </label>
          <label className="font-tag text-[11px] uppercase text-muted">
            au
            <input type="date" value={periode.au} onChange={(e) => setPeriode({ ...periode, au: e.target.value })} className={`${champDate} ml-1`} />
          </label>
          <select value={periode.quoi} onChange={(e) => setPeriode({ ...periode, quoi: e.target.value })} className={champDate}>
            <option value="tout">livraison et retrait</option>
            <option value="livraison">la livraison seulement</option>
            <option value="retrait">le retrait seulement</option>
          </select>
          <button
            type="button"
            onClick={fermerPeriode}
            disabled={!periode.du || !periode.au || periode.au < periode.du}
            className="font-tag text-xs uppercase font-semibold px-3 py-2 bg-rust text-paper hover:bg-ink disabled:bg-muted"
          >
            Fermer
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px] mb-4">
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
          <Calendrier mois={mois} speciaux={speciaux} jourEdite={jourEdite} aujourdhui={aujourdhui} onClic={setJourEdite} />
          <p className="mt-2 font-tag text-[11px] text-muted">
            <span className="inline-block w-3 h-3 bg-rust align-middle mr-1" /> fermé ·{' '}
            <span className="inline-block w-3 h-3 bg-[#f3e6d0] border border-ink/15 align-middle mr-1" /> horaires modifiés ·{' '}
            <span className="inline-block w-3 h-3 bg-paper border border-ink/15 align-middle mr-1" /> semaine type
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {jourEdite ? (
            <div className="bg-paper border-2 border-forest p-3">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-display text-xl text-ink leading-tight">{libelleDate(dateDepuisCle(jourEdite))}</h3>
                <button type="button" onClick={() => setJourEdite(null)} className="font-tag text-xs uppercase text-muted hover:text-ink">
                  Fermer ✕
                </button>
              </div>
              {TYPES.map((t) => (
                <div key={`${jourEdite}-${t.cle}`} className="mb-3">
                  <p className="font-tag text-[11px] uppercase text-muted mb-1">{t.titre}</p>
                  <ChoixHoraires
                    type={t.cle}
                    liste={speciaux[jourEdite]?.[t.cle] ?? null}
                    habituel={habituel(t.cle, jourEdite)}
                    onChange={(liste) => definirJour(jourEdite, t.cle, liste)}
                  />
                </div>
              ))}
              {speciaux[jourEdite] && (
                <button
                  type="button"
                  onClick={() => TYPES.forEach((t) => definirJour(jourEdite, t.cle, null))}
                  className="font-tag text-xs uppercase underline text-muted hover:text-ink"
                >
                  Remettre ce jour comme d'habitude
                </button>
              )}
            </div>
          ) : (
            <div className="bg-paper border border-ink/15 p-3 font-body text-sm text-muted">
              Cliquez sur un jour du calendrier pour le modifier.
            </div>
          )}

          <div className="bg-paper border border-ink/15 p-3">
            <p className="font-tag text-xs uppercase text-muted mb-2">Prochains jours particuliers</p>
            {prochains.length === 0 ? (
              <p className="font-body text-sm text-muted">Aucun : tout suit la semaine type.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {prochains.map((cle) => (
                  <li key={cle} className="flex items-start justify-between gap-2 font-body text-sm">
                    <button type="button" onClick={() => setJourEdite(cle)} className="text-left hover:underline">
                      {libelleDate(dateDepuisCle(cle))}
                      {TYPES.filter((t) => Array.isArray(speciaux[cle][t.cle])).map((t) => (
                        <span key={t.cle} className={`block font-tag text-[11px] ${speciaux[cle][t.cle].length ? 'text-ink' : 'text-rust'}`}>
                          {t.titre} : {resume(t.cle, speciaux[cle][t.cle])}
                        </span>
                      ))}
                    </button>
                    <button
                      type="button"
                      onClick={() => TYPES.forEach((t) => definirJour(cle, t.cle, null))}
                      className="shrink-0 font-tag text-[11px] uppercase text-muted hover:text-ink"
                    >
                      Remettre normal
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Anciens « jours fermés » (colonne jours_fermes) → fermetures dans horaires_speciaux (liste vide = fermé).
function avecFermetures(speciaux, joursFermes) {
  const s = JSON.parse(JSON.stringify(speciaux || {}))
  Object.entries(joursFermes || {}).forEach(([cle, quoi]) => {
    s[cle] = {
      ...(s[cle] || {}),
      ...(quoi !== 'retrait' ? { livraison: [] } : {}),
      ...(quoi !== 'livraison' ? { retrait: [] } : {}),
    }
  })
  return s
}

export default function CalendarPanel() {
  const { settings, loading, updateSettings } = useSiteSettings()
  if (loading || !settings) return <p className="font-body text-sm text-muted">Chargement…</p>
  return (
    <CalendarEditor
      initialIndispo={settings.creneaux_indisponibles || { retrait: {}, livraison: {} }}
      initialSpeciaux={avecFermetures(settings.horaires_speciaux, settings.jours_fermes)}
      onSave={(changes) => updateSettings(changes)}
    />
  )
}
