import { useMemo, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import {
  JOURS_OUVRES,
  NOM_JOUR,
  cleDate,
  dateDepuisCle,
  libelleDate,
  joursFeries,
  heureTexte,
  PLAGES_DEFAUT,
  plagesSemaine,
  plagesPourDate,
} from '../lib/pickupSlots'

// Calendrier de l'admin (05/11/2026) : de vraies heures, en une ou plusieurs plages par jour.
// 1. « Semaine type » (colonne horaires_semaine) : les horaires proposés d'office chaque lundi, mardi…
//    Retrait : plages libres découpées en créneaux de 30 min. Livraison : chaque plage = un créneau
//    (par défaut matin 9h-12h, midi 12h-14h, après-midi 14h-18h, heures modifiables).
// 2. Calendrier (colonne horaires_jours) : pour une date précise, d'autres horaires ou fermé ([]).
// Les anciens réglages (jours_fermes, creneaux_indisponibles, horaires_speciaux) sont repris à l'ouverture
// et vidés à l'enregistrement.

const TYPES = [
  { cle: 'livraison', titre: 'Livraison', court: 'Liv.' },
  { cle: 'retrait', titre: 'Retrait au dépôt', court: 'Ret.' },
]
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const versChamp = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const depuisChamp = (v) => {
  const [h, m] = String(v || '').split(':').map(Number)
  return Number.isFinite(h) ? h * 60 + (m || 0) : null
}
const trier = (plages) => [...plages].sort((a, b) => a[0] - b[0])
const memes = (a, b) => JSON.stringify(trier(a || [])) === JSON.stringify(trier(b || []))

// « 8h30–12h et 14h–17h30 », ou « Fermé ».
function resume(plages, court = false) {
  const valides = trier(plages || []).filter(([d, f]) => f > d)
  if (valides.length === 0) return 'Fermé'
  const h = (m) => (court ? heureTexte(m).replace(/h00$/, 'h') : heureTexte(m))
  return valides.map(([d, f]) => `${h(d)}–${h(f)}`).join(court ? ', ' : ' · ')
}

// Liste de plages modifiables : « de [8:30] à [12:00] × », « + ajouter une plage », raccourcis.
function Plages({ type, plages, onChange }) {
  const modifier = (i, borne, valeur) => {
    const m = depuisChamp(valeur)
    if (m === null) return
    onChange(plages.map((p, j) => (j === i ? (borne === 0 ? [m, p[1]] : [p[0], m]) : p)))
  }
  const ajouter = () => {
    const derniere = trier(plages)[plages.length - 1]
    const debut = derniere ? Math.min(derniere[1], 21 * 60) : 9 * 60
    onChange([...plages, [debut, Math.min(debut + 120, 22 * 60)]])
  }
  const champ = 'border border-ink/30 bg-paper px-1.5 py-1 font-body text-sm focus:border-forest focus:outline-none'
  const petitBouton = 'font-tag text-[11px] uppercase font-semibold border px-2 py-1'

  return (
    <div>
      {plages.length === 0 && <p className="font-tag text-sm font-semibold text-rust mb-1">Fermé</p>}
      {plages.map(([d, f], i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="font-tag text-[11px] uppercase text-muted">de</span>
          <input type="time" step="300" value={versChamp(d)} onChange={(e) => modifier(i, 0, e.target.value)} className={champ} />
          <span className="font-tag text-[11px] uppercase text-muted">à</span>
          <input type="time" step="300" value={versChamp(f)} onChange={(e) => modifier(i, 1, e.target.value)} className={champ} />
          <button
            type="button"
            onClick={() => onChange(plages.filter((_, j) => j !== i))}
            className="font-bold text-muted hover:text-rust px-1"
            aria-label="Supprimer cette plage"
          >
            ×
          </button>
          {f <= d && <span className="font-tag text-[11px] text-rust">la fin doit être après le début</span>}
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5 mt-1">
        <button type="button" onClick={ajouter} className={`${petitBouton} border-forest text-forest hover:bg-forest hover:text-paper`}>
          + ajouter une plage
        </button>
        <button type="button" onClick={() => onChange(PLAGES_DEFAUT[type].map((p) => [...p]))} className={`${petitBouton} border-ink/30 text-ink hover:bg-stone`}>
          {type === 'livraison' ? 'Matin / midi / après-midi' : '8h à 18h'}
        </button>
        {plages.length > 0 && (
          <button type="button" onClick={() => onChange([])} className={`${petitBouton} border-rust/50 text-rust hover:bg-rust hover:text-paper`}>
            Fermé
          </button>
        )}
      </div>
      {type === 'retrait' && plages.length > 0 && (
        <p className="font-tag text-[10px] text-muted mt-1">Le client choisit un créneau de 30 minutes dans ces plages.</p>
      )}
      {type === 'livraison' && plages.length > 0 && (
        <p className="font-tag text-[10px] text-muted mt-1">Chaque plage est un créneau de livraison proposé au client.</p>
      )}
    </div>
  )
}

function Calendrier({ mois, jours, jourEdite, aujourdhui, onClic }) {
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
        const lignes = TYPES.map((t) => ({ ...t, plages: jours[cle]?.[t.cle] })).filter((t) => Array.isArray(t.plages))
        const toutFerme = lignes.length === 2 && lignes.every((t) => t.plages.length === 0)
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
                <span key={t.cle} className={`block font-tag text-[9px] leading-tight ${t.plages.length === 0 ? 'text-rust font-semibold' : 'text-ink'}`}>
                  {t.court} {resume(t.plages, true)}
                </span>
              ))
            )}
          </button>
        )
      })}
    </div>
  )
}

function CalendarEditor({ initialSemaine, initialJours, onSave }) {
  const [semaine, setSemaine] = useState(initialSemaine)
  const [jours, setJours] = useState(initialJours)
  const [saved, setSaved] = useState(() => JSON.stringify([initialSemaine, initialJours]))
  const [jourEdite, setJourEdite] = useState(null)
  const [periode, setPeriode] = useState({ du: '', au: '', quoi: 'tout' })
  const [mois, setMois] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [saving, setSaving] = useState(false)
  const aujourdhui = cleDate(new Date())
  const dirty = JSON.stringify([semaine, jours]) !== saved
  const habituel = (type, cle) => semaine[type][String(dateDepuisCle(cle).getDay())] || []

  const definirSemaine = (type, jour, plages) =>
    setSemaine((prev) => ({ ...prev, [type]: { ...prev[type], [String(jour)]: plages } }))

  // Une date : ses plages ; null = comme d'habitude.
  const definirJour = (cle, type, plages) =>
    setJours((prev) => {
      const jour = { ...(prev[cle] || {}) }
      if (plages === null) delete jour[type]
      else jour[type] = plages
      const next = { ...prev }
      if (Object.keys(jour).length === 0) delete next[cle]
      else next[cle] = jour
      return next
    })

  const fermer = (cles, quoi) =>
    setJours((prev) => {
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

  const prochains = useMemo(() => Object.keys(jours).filter((cle) => cle >= aujourdhui).sort(), [jours, aujourdhui])

  const enregistrer = async () => {
    setSaving(true)
    try {
      // Plages incohérentes (fin avant début) ou réglage identique à la semaine type : on ne garde pas.
      const propre = (p) => trier(p.filter(([d, f]) => f > d))
      const s = Object.fromEntries(
        TYPES.map((t) => [t.cle, Object.fromEntries(Object.entries(semaine[t.cle]).map(([j, p]) => [j, propre(p)]))])
      )
      const j = {}
      Object.entries(jours)
        .filter(([cle]) => cle >= aujourdhui)
        .forEach(([cle, parType]) => {
          Object.entries(parType).forEach(([type, p]) => {
            const habitude = s[type][String(dateDepuisCle(cle).getDay())] || []
            if (!memes(propre(p), habitude)) j[cle] = { ...(j[cle] || {}), [type]: propre(p) }
          })
        })
      await onSave({
        horaires_semaine: s,
        horaires_jours: j,
        // Anciens réglages remplacés par les deux colonnes ci-dessus.
        jours_fermes: {},
        horaires_speciaux: {},
        creneaux_indisponibles: { retrait: {}, livraison: {} },
      })
      setSemaine(s)
      setJours(j)
      setSaved(JSON.stringify([s, j]))
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const champDate = 'border border-ink/30 bg-paper p-1.5 font-body text-sm focus:border-forest focus:outline-none'
  const enCours = jourEdite ? jours[jourEdite] : null

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

      <h2 className="font-display text-2xl text-ink mb-1">1. La semaine type</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Les horaires proposés d'office, chaque semaine. Mettez les heures que vous voulez, en une ou plusieurs plages
        (par exemple 8h30 à 12h et 14h à 17h30). Un jour sans plage est fermé.
      </p>
      <div className="bg-paper border border-ink/15 mb-8 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
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
                    <Plages type={t.cle} plages={semaine[t.cle][String(j)] || []} onChange={(p) => definirSemaine(t.cle, j, p)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display text-2xl text-ink mb-1">2. Les jours particuliers</h2>
      <p className="font-body text-sm text-muted mb-3 max-w-3xl">
        Cliquez sur un jour pour lui mettre d'autres horaires ou le fermer. Les cases colorées ne suivent pas la semaine
        type.
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

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] mb-4">
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
          <Calendrier mois={mois} jours={jours} jourEdite={jourEdite} aujourdhui={aujourdhui} onClic={setJourEdite} />
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
              {TYPES.map((t) => {
                const special = enCours?.[t.cle]
                const habitude = habituel(t.cle, jourEdite)
                return (
                  <div key={t.cle} className="mb-4 pb-3 border-b border-ink/10 last:border-b-0">
                    <p className="font-tag text-[11px] uppercase text-muted mb-1">{t.titre}</p>
                    {Array.isArray(special) ? (
                      <>
                        <Plages type={t.cle} plages={special} onChange={(p) => definirJour(jourEdite, t.cle, p)} />
                        <button
                          type="button"
                          onClick={() => definirJour(jourEdite, t.cle, null)}
                          className="mt-2 font-tag text-[11px] uppercase underline text-muted hover:text-ink"
                        >
                          Remettre comme d'habitude ({resume(habitude, true)})
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-body text-sm mb-2">
                          Comme d'habitude : <strong>{resume(habitude)}</strong>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => definirJour(jourEdite, t.cle, habitude.map((p) => [...p]))}
                            className="font-tag text-[11px] uppercase font-semibold border border-forest text-forest px-2 py-1 hover:bg-forest hover:text-paper"
                          >
                            Changer les horaires ce jour
                          </button>
                          <button
                            type="button"
                            onClick={() => definirJour(jourEdite, t.cle, [])}
                            className="font-tag text-[11px] uppercase font-semibold border border-rust/50 text-rust px-2 py-1 hover:bg-rust hover:text-paper"
                          >
                            Fermé ce jour
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
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
                      {TYPES.filter((t) => Array.isArray(jours[cle][t.cle])).map((t) => (
                        <span key={t.cle} className={`block font-tag text-[11px] ${jours[cle][t.cle].length ? 'text-ink' : 'text-rust'}`}>
                          {t.titre} : {resume(jours[cle][t.cle])}
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

// Lecture des réglages : nouvelles colonnes si elles existent, sinon conversion des anciens réglages.
function lireReglages(settings) {
  const cal = {
    semaine: settings.horaires_semaine || null,
    jours: settings.horaires_jours || null,
    joursFermes: settings.jours_fermes,
    indispo: settings.creneaux_indisponibles,
    speciaux: settings.horaires_speciaux,
  }
  const semaine = Object.fromEntries(
    TYPES.map((t) => [t.cle, Object.fromEntries(JOURS_OUVRES.map((j) => [String(j), plagesSemaine(t.cle, j, cal)]))])
  )
  if (cal.jours) return { semaine, jours: cal.jours }
  const aujourdhui = cleDate(new Date())
  const jours = {}
  const cles = new Set([...Object.keys(cal.joursFermes || {}), ...Object.keys(cal.speciaux || {})])
  ;[...cles]
    .filter((cle) => cle >= aujourdhui)
    .forEach((cle) => {
      TYPES.forEach((t) => {
        const p = plagesPourDate(t.cle, cle, cal)
        if (!memes(p, semaine[t.cle][String(dateDepuisCle(cle).getDay())])) jours[cle] = { ...(jours[cle] || {}), [t.cle]: p }
      })
    })
  return { semaine, jours }
}

export default function CalendarPanel() {
  const { settings, loading, updateSettings } = useSiteSettings()
  const initial = useMemo(() => (settings ? lireReglages(settings) : null), [settings])
  if (loading || !initial) return <p className="font-body text-sm text-muted">Chargement…</p>
  return <CalendarEditor initialSemaine={initial.semaine} initialJours={initial.jours} onSave={(changes) => updateSettings(changes)} />
}
