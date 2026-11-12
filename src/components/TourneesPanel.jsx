import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { aujourdhuiParis } from '../../supabase/functions/_shared/calculCommande.js'
import {
  COMMERCIAUX,
  NOMS_COMMUNES,
  RAYON_DEPOT_DEFAUT,
  RAYON_TOURNEE_DEFAUT,
  conseilsLivraison,
  distanceDepot,
  lireCollage,
} from '../lib/tournees'

// Onglet « Tournées » de l'admin (12/11/2026) : plannings mensuels des commerciaux (copiés depuis leur tableau
// Excel), et simulation des jours de livraison conseillés aux clients. RIEN n'est encore visible côté client.
const champ = 'border border-ink/20 p-1.5 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const etiquette = 'block font-tag text-[10px] uppercase text-muted mb-1'
const bouton =
  'bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-3 py-2 hover:bg-forest disabled:bg-muted'
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
const dateCourte = (d) => {
  const x = new Date(`${d}T12:00:00`)
  return `${JOURS[x.getDay()]} ${x.getDate()}/${String(x.getMonth() + 1).padStart(2, '0')}`
}
const dateLongue = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const moisSuivant = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const bornesMois = (mois) => {
  const [a, m] = mois.split('-').map(Number)
  return [`${mois}-01`, `${mois}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`]
}

function Cadre({ titre, children }) {
  return (
    <section className="bg-paper border border-ink/15 p-4 mb-5">
      <h2 className="font-display text-2xl text-ink mb-3">{titre}</h2>
      {children}
    </section>
  )
}

function ChoixCommune({ onChoisir, libelle = '+ commune' }) {
  return (
    <select value="" onChange={(e) => e.target.value && onChoisir(e.target.value)} className={`${champ} text-xs py-1`}>
      <option value="">{libelle}</option>
      {NOMS_COMMUNES.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  )
}

// 1. Saisie d'un mois par copier-coller depuis Excel.
function SaisieMois({ onEnregistre }) {
  const [commercial, setCommercial] = useState(COMMERCIAUX[0])
  const [mois, setMois] = useState(moisSuivant)
  const [texte, setTexte] = useState('')
  const [lignes, setLignes] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState('')

  const lire = () => {
    setMessage('')
    setLignes(lireCollage(texte, mois))
  }
  const modifierLigne = (i, changes) => setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, ...changes } : l)))
  const aPreciser = (lignes || []).filter((l) => l.aPreciser.length).length

  const enregistrer = async () => {
    if (aPreciser && !confirm(`${aPreciser} ligne(s) ont encore un lieu à préciser (en rouge). Enregistrer quand même ?`)) return
    setEnCours(true)
    const [debut, fin] = bornesMois(mois)
    const { error: e1 } = await supabase.from('tournees').delete().eq('commercial', commercial).gte('jour', debut).lte('jour', fin)
    const lignesOk = lignes.filter((l) => l.communes.length)
    const { error: e2 } = lignesOk.length
      ? await supabase
          .from('tournees')
          .insert(lignesOk.map((l) => ({ commercial, jour: l.date, lieu: l.lieu, communes: l.communes })))
      : { error: null }
    setEnCours(false)
    if (e1 || e2) return setMessage(`Erreur : ${(e1 || e2).message}`)
    setMessage(`Enregistré : ${lignesOk.length} jour(s) de tournée pour ${commercial} en ${mois}.`)
    setLignes(null)
    setTexte('')
    onEnregistre(mois)
  }

  return (
    <Cadre titre="1. Saisir le planning d'un mois">
      <ol className="font-body text-xs text-muted mb-3 list-decimal pl-4 space-y-0.5">
        <li>Choisissez le commercial et le mois.</li>
        <li>
          Dans son tableau Excel (onglet du mois), sélectionnez les colonnes de <strong>JOUR</strong> à <strong>LIEU</strong>{' '}
          (lignes des jours 1 à 31), copiez (Ctrl + C), puis collez ci-dessous (Ctrl + V).
        </li>
        <li>Cliquez sur « Lire le tableau », vérifiez les communes (corrigez ce qui est en rouge), puis enregistrez.</li>
      </ol>
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <div>
          <label className={etiquette}>Commercial</label>
          <select value={commercial} onChange={(e) => setCommercial(e.target.value)} className={champ}>
            {COMMERCIAUX.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={etiquette}>Mois</label>
          <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} className={champ} />
        </div>
      </div>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={6}
        placeholder="Collez ici les lignes copiées depuis Excel…"
        className={`${champ} w-full font-mono text-xs`}
      />
      <div className="flex gap-3 items-center mt-2">
        <button type="button" onClick={lire} disabled={!texte.trim()} className={bouton}>
          Lire le tableau
        </button>
        {message && <p className={`font-body text-sm ${message.startsWith('Erreur') ? 'text-rust' : 'text-forest'}`}>{message}</p>}
      </div>

      {lignes && (
        <div className="mt-4">
          {lignes.length === 0 ? (
            <p className="font-body text-sm text-rust">
              Aucune ligne reconnue : vérifiez que la 1re colonne copiée est bien « JOUR » (1 à 31).
            </p>
          ) : (
            <>
              <p className="font-tag text-xs uppercase text-muted mb-2">
                Aperçu : {commercial}, {lignes.length} jour(s){aPreciser ? ` · ${aPreciser} à préciser` : ''}
              </p>
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="font-tag text-[10px] uppercase text-muted border-b border-ink/15 text-left">
                    <th className="py-1 w-24">Jour</th>
                    <th className="py-1 w-56">Dans le tableau</th>
                    <th className="py-1">Communes de la tournée</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((l, i) => (
                    <tr key={l.date} className="border-b border-ink/10 align-top">
                      <td className="py-1.5 font-tag text-xs">{dateCourte(l.date)}</td>
                      <td className="py-1.5 font-body text-xs text-muted">{l.lieu}</td>
                      <td className="py-1.5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {l.communes.map((c) => (
                            <span key={c} className="inline-flex items-center gap-1 bg-forest text-paper font-tag text-[11px] px-2 py-0.5">
                              {c}
                              <button
                                type="button"
                                onClick={() => modifierLigne(i, { communes: l.communes.filter((x) => x !== c) })}
                                aria-label={`Retirer ${c}`}
                                className="hover:text-rust"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {l.aPreciser.map((p, k) => (
                            <span key={k} className="inline-flex items-center gap-1 border border-rust text-rust font-tag text-[11px] px-2 py-0.5">
                              « {p.texte} » ?
                              {p.candidats.length > 0 ? (
                                <select
                                  value=""
                                  onChange={(e) =>
                                    e.target.value &&
                                    modifierLigne(i, {
                                      communes: [...l.communes, e.target.value],
                                      aPreciser: l.aPreciser.filter((_, n) => n !== k),
                                    })
                                  }
                                  className="border border-rust/50 bg-paper text-[11px] py-0"
                                >
                                  <option value="">choisir…</option>
                                  {p.candidats.map((c) => (
                                    <option key={c}>{c}</option>
                                  ))}
                                </select>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => modifierLigne(i, { aPreciser: l.aPreciser.filter((_, n) => n !== k) })}
                                className="underline text-muted hover:text-ink"
                              >
                                ignorer
                              </button>
                            </span>
                          ))}
                          <ChoixCommune
                            onChoisir={(c) => !l.communes.includes(c) && modifierLigne(i, { communes: [...l.communes, c] })}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={enregistrer} disabled={enCours} className={bouton}>
                {enCours ? 'Enregistrement…' : `Enregistrer le mois pour ${commercial}`}
              </button>
              <p className="font-body text-xs text-muted mt-1">
                Remplace le planning déjà enregistré pour {commercial} sur ce mois.
              </p>
            </>
          )}
        </div>
      )}
    </Cadre>
  )
}

// 2. Plannings enregistrés, mois par mois (un jour par ligne, un commercial par colonne).
function Plannings({ tournees, mois, setMois, onSupprimer }) {
  const [debut, fin] = bornesMois(mois)
  const duMois = tournees.filter((t) => t.jour >= debut && t.jour <= fin)
  const jours = [...new Set(duMois.map((t) => t.jour))].sort()
  const cellule = (jour, c) => duMois.find((t) => t.jour === jour && t.commercial === c)
  const parCommercial = Object.fromEntries(COMMERCIAUX.map((c) => [c, duMois.filter((t) => t.commercial === c).length]))
  return (
    <Cadre titre="2. Plannings enregistrés">
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <div>
          <label className={etiquette}>Mois</label>
          <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} className={champ} />
        </div>
        <p className="font-tag text-xs text-muted">
          {COMMERCIAUX.map((c) => `${c} : ${parCommercial[c] || 0} jour(s)`).join(' · ')}
        </p>
      </div>
      {jours.length === 0 ? (
        <p className="font-body text-sm text-muted">Aucune tournée enregistrée pour ce mois.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="font-tag text-[10px] uppercase text-muted border-b border-ink/15 text-left">
                <th className="py-1 w-24">Jour</th>
                {COMMERCIAUX.map((c) => (
                  <th key={c} className="py-1">
                    {c}
                    {parCommercial[c] > 0 && (
                      <button
                        type="button"
                        onClick={() => onSupprimer(c, mois)}
                        className="ml-2 normal-case underline text-muted hover:text-rust"
                      >
                        vider le mois
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jours.map((j) => (
                <tr key={j} className="border-b border-ink/10 align-top">
                  <td className="py-1.5 font-tag text-xs">{dateCourte(j)}</td>
                  {COMMERCIAUX.map((c) => {
                    const t = cellule(j, c)
                    return (
                      <td key={c} className="py-1.5 font-body text-xs">
                        {t ? t.communes.join(', ') : <span className="text-muted/50">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Cadre>
  )
}

// 3. Simulation : ce que verrait un client de telle commune (rien n'est encore affiché côté client).
function Simulation({ tournees, rayonDepot, rayonTournee }) {
  const [commune, setCommune] = useState('')
  const resultat = commune
    ? conseilsLivraison(commune, tournees, { aujourdhui: aujourdhuiParis(), rayonDepot, rayonTournee })
    : null
  const prochains = resultat?.conseils?.slice(0, 3) || []
  return (
    <Cadre titre="3. Tester une commune">
      <p className="font-body text-xs text-muted mb-3">
        Choisissez la commune d'un client : vous voyez si elle est dans la zone du dépôt, et sinon les prochains passages
        de tournée dans la commune ou à moins de {rayonTournee} km. <strong>Rien n'est encore visible par les clients.</strong>
      </p>
      <div className="flex flex-wrap gap-3 items-end mb-3">
        <div>
          <label className={etiquette}>Commune du client</label>
          <select value={commune} onChange={(e) => setCommune(e.target.value)} className={champ}>
            <option value="">— choisir —</option>
            {NOMS_COMMUNES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        {commune && (
          <p className="font-tag text-xs text-muted">À {distanceDepot(commune)?.toFixed(1)} km du dépôt (à vol d'oiseau)</p>
        )}
      </div>
      {resultat &&
        (resultat.zoneDepot ? (
          <p className="font-body text-sm text-forest">
            Zone du dépôt (moins de {rayonDepot} km) : livraison par Romuald, tous les jours du calendrier. Pas de conseil.
          </p>
        ) : resultat.conseils.length === 0 ? (
          <p className="font-body text-sm text-muted">
            Aucune tournée prévue dans la commune ou à moins de {rayonTournee} km : pas de jour conseillé (le client choisit
            librement, comme aujourd'hui).
          </p>
        ) : (
          <div>
            <table className="text-sm mb-3">
              <tbody>
                {resultat.conseils.map((c) => (
                  <tr key={c.date} className="border-b border-ink/10">
                    <td className="py-1 pr-4 font-tag text-xs">{dateLongue(c.date)}</td>
                    <td className="py-1 pr-4 font-body text-xs">{c.commercial}</td>
                    <td className="py-1 pr-4 font-body text-xs">
                      tournée de {c.commune}
                      {c.distance > 0.05 ? ` (à ${c.distance.toFixed(1)} km)` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-tag text-[10px] uppercase text-muted mb-1">Message que verrait le client (plus tard)</p>
            <div className="border border-forest/40 bg-stone/50 p-3 font-body text-sm text-ink max-w-xl">
              <p>
                🚚 <strong>Un camion Bontin passe près de chez vous le {prochains.map((c) => dateLongue(c.date)).join(' ou le ')}</strong>{' '}
                (tournée de {prochains[0].commune}).
              </p>
              <p className="mt-1">
                Si cette date vous convient, choisissez-la : en regroupant les livraisons d'un même secteur, nous faisons moins
                de kilomètres et limitons notre impact sur l'environnement.
              </p>
              <p className="mt-1 italic text-muted">Ce n'est qu'une suggestion : vous restez libre de choisir le jour qui vous arrange.</p>
            </div>
          </div>
        ))}
    </Cadre>
  )
}

function Reglages({ settings, updateSettings }) {
  const [depot, setDepot] = useState(String(settings?.tournees_rayon_depot ?? RAYON_DEPOT_DEFAUT))
  const [proche, setProche] = useState(String(settings?.tournees_rayon_proximite ?? RAYON_TOURNEE_DEFAUT))
  const enregistrer = async (champ, valeur) => {
    const n = Number(String(valeur).replace(',', '.'))
    if (!(n > 0)) return
    try {
      await updateSettings({ [champ]: n })
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }
  return (
    <Cadre titre="Réglages">
      <div className="flex flex-wrap gap-5 items-end">
        <div>
          <label className={etiquette}>Zone du dépôt (livrée tous les jours)</label>
          <input
            type="number"
            min="1"
            step="0.5"
            value={depot}
            onChange={(e) => setDepot(e.target.value)}
            onBlur={() => enregistrer('tournees_rayon_depot', depot)}
            className={`${champ} w-20`}
          />{' '}
          <span className="font-tag text-xs text-muted">km</span>
        </div>
        <div>
          <label className={etiquette}>Tournée conseillée si à moins de</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={proche}
            onChange={(e) => setProche(e.target.value)}
            onBlur={() => enregistrer('tournees_rayon_proximite', proche)}
            className={`${champ} w-20`}
          />{' '}
          <span className="font-tag text-xs text-muted">km</span>
        </div>
      </div>
    </Cadre>
  )
}

export default function TourneesPanel() {
  const { settings, updateSettings } = useSiteSettings()
  const [tournees, setTournees] = useState([])
  const [mois, setMois] = useState(moisSuivant)

  const charger = useCallback(async () => {
    const { data } = await supabase.from('tournees').select('*').order('jour')
    setTournees(data || [])
  }, [])
  useEffect(() => {
    charger()
  }, [charger])

  const supprimerMois = async (commercial, m) => {
    if (!confirm(`Vider le planning de ${commercial} pour ${m} ?`)) return
    const [debut, fin] = bornesMois(m)
    const { error } = await supabase.from('tournees').delete().eq('commercial', commercial).gte('jour', debut).lte('jour', fin)
    if (error) alert(`Erreur : ${error.message}`)
    charger()
  }

  const rayonDepot = Number(settings?.tournees_rayon_depot ?? RAYON_DEPOT_DEFAUT)
  const rayonTournee = Number(settings?.tournees_rayon_proximite ?? RAYON_TOURNEE_DEFAUT)
  const toutes = useMemo(() => tournees, [tournees])

  return (
    <div>
      <p className="font-body text-sm text-muted mb-4 max-w-3xl">
        Plannings des commerciaux ({COMMERCIAUX.join(', ')}). Au-delà de {rayonDepot} km du dépôt, on pourra conseiller aux
        clients en livraison les jours où une tournée passe dans leur commune ou à moins de {rayonTournee} km. Pour
        l'instant, <strong>tout reste ici, dans l'admin</strong> : les clients ne voient rien.
      </p>
      <SaisieMois
        onEnregistre={(m) => {
          setMois(m)
          charger()
        }}
      />
      <Plannings tournees={toutes} mois={mois} setMois={setMois} onSupprimer={supprimerMois} />
      <Simulation tournees={toutes} rayonDepot={rayonDepot} rayonTournee={rayonTournee} />
      {settings && <Reglages settings={settings} updateSettings={updateSettings} />}
    </div>
  )
}
