import { useMemo, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { COMMUNES_ZONE, COMMUNES_PAR_CODE_POSTAL, SECTEURS_ORDRE } from '../data/communesZone'

const byName = (a, b) => a.n.localeCompare(b.n, 'fr')

const GROUPES = SECTEURS_ORDRE.map((titre) => ({
  titre,
  communes: COMMUNES_ZONE.filter((c) => c.z === 'in' && c.g === titre).sort(byName),
})).filter((g) => g.communes.length > 0)

const LIMITES = [
  { titre: "Juste à l'est de Plougasnou - Carhaix", communes: COMMUNES_ZONE.filter((c) => c.z === 'est').sort(byName) },
  { titre: 'Juste au sud de Crozon - Châteaulin', communes: COMMUNES_ZONE.filter((c) => c.z === 'sud').sort(byName) },
].filter((g) => g.communes.length > 0)

const PRINCIPALES = COMMUNES_ZONE.filter((c) => c.z === 'in')

function Groupe({ titre, communes, selection, onToggle, onSet, note }) {
  const cochees = communes.filter((c) => selection.has(c.n)).length
  return (
    <section className="bg-paper border border-ink/15 mb-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-ink/15">
        <h3 className="font-display text-xl text-ink">
          {titre}
          <span className="font-tag text-xs text-muted ml-2">
            {cochees} sur {communes.length}
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSet(communes, true)}
            className="font-tag text-[11px] uppercase font-semibold border border-ink/30 text-muted px-2 py-1 hover:bg-stone"
          >
            Cocher le secteur
          </button>
          <button
            type="button"
            onClick={() => onSet(communes, false)}
            className="font-tag text-[11px] uppercase font-semibold border border-ink/30 text-muted px-2 py-1 hover:bg-stone"
          >
            Décocher
          </button>
        </div>
      </div>
      {note && <p className="px-3 py-2 font-body text-xs text-muted border-b border-ink/15">{note}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {communes.map((c) => {
          const partage = c.cp.some((cp) => (COMMUNES_PAR_CODE_POSTAL[cp] || []).length > 1)
          return (
            <label
              key={c.n}
              className="flex items-start gap-2 px-3 py-2 border-b border-ink/10 cursor-pointer hover:bg-stone"
            >
              <input
                type="checkbox"
                checked={selection.has(c.n)}
                onChange={() => onToggle(c.n)}
                className="mt-1 w-4 h-4 accent-forest shrink-0"
              />
              <span className="min-w-0">
                <span className="block font-body text-sm text-ink">{c.n}</span>
                <span className="block font-tag text-[11px] text-muted">
                  {c.cp.join(' / ')}
                  {partage && <span className="text-rust"> · code partagé</span>}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}

function ZoneEditor({ initial, onSave }) {
  const [selection, setSelection] = useState(() => new Set(initial))
  const [saved, setSaved] = useState(() => new Set(initial))
  const [saving, setSaving] = useState(false)

  const dirty = selection.size !== saved.size || [...selection].some((n) => !saved.has(n))

  const toggle = (nom) =>
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(nom)) next.delete(nom)
      else next.add(nom)
      return next
    })
  const setMany = (communes, on) =>
    setSelection((prev) => {
      const next = new Set(prev)
      communes.forEach((c) => {
        if (on) next.add(c.n)
        else next.delete(c.n)
      })
      return next
    })

  // Codes postaux dont une commune est cochée alors qu'une autre commune du même code ne l'est pas.
  const partages = useMemo(() => {
    const codes = new Set(COMMUNES_ZONE.filter((c) => selection.has(c.n)).flatMap((c) => c.cp))
    return [...codes]
      .sort()
      .map((cp) => ({ cp, autres: (COMMUNES_PAR_CODE_POSTAL[cp] || []).filter((n) => !selection.has(n)) }))
      .filter((x) => x.autres.length > 0)
  }, [selection])

  const enregistrer = async () => {
    setSaving(true)
    try {
      await onSave([...selection].sort((a, b) => a.localeCompare(b, 'fr')))
      setSaved(new Set(selection))
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="font-body text-sm text-muted mb-4 max-w-3xl">
        Cochez les communes où nous livrons. En mode Livraison, un client dont le code postal n'est
        pas dans une commune cochée voit un message l'invitant à choisir le retrait au dépôt. Le
        retrait n'est jamais limité. <strong>Tant qu'aucune commune n'est cochée, la livraison est
        acceptée partout.</strong>
      </p>

      <div className="sticky top-0 z-10 bg-paper border border-ink/15 px-3 py-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="font-tag text-sm">
          <span className="font-display text-2xl text-forest mr-1">{selection.size}</span>
          commune{selection.size > 1 ? 's' : ''} cochée{selection.size > 1 ? 's' : ''}
          {dirty && <span className="text-rust ml-3">modifications non enregistrées</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMany(PRINCIPALES, true)}
            className="font-tag text-xs uppercase font-semibold border border-ink px-3 py-1.5 hover:bg-stone"
          >
            Tout cocher (zone principale)
          </button>
          <button
            type="button"
            onClick={() => setSelection(new Set())}
            className="font-tag text-xs uppercase font-semibold border border-ink px-3 py-1.5 hover:bg-stone"
          >
            Tout décocher
          </button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={!dirty || saving}
            className="font-tag text-xs uppercase font-semibold bg-forest text-paper px-4 py-1.5 hover:bg-ink disabled:bg-muted disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer la zone'}
          </button>
        </div>
      </div>

      {partages.length > 0 && (
        <div className="border border-rust bg-paper p-3 mb-4">
          <p className="font-tag text-xs uppercase font-semibold text-rust mb-1">Codes postaux partagés</p>
          <p className="font-body text-xs text-muted mb-2">
            Ces codes sont utilisés par plusieurs communes. Le site vérifie alors aussi le nom de la
            ville saisie par le client : seules les communes cochées sont acceptées.
          </p>
          <ul className="list-disc pl-5 font-body text-xs">
            {partages.map((p) => (
              <li key={p.cp}>
                <strong>{p.cp}</strong> : non cochée{p.autres.length > 1 ? 's' : ''} : {p.autres.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {GROUPES.map((g) => (
        <Groupe
          key={g.titre}
          {...g}
          selection={selection}
          onToggle={toggle}
          onSet={setMany}
          note={
            g.titre.startsWith('Îles')
              ? "Ces îles ne sont accessibles que par bateau : à cocher seulement si vous les desservez vraiment."
              : ''
          }
        />
      ))}

      {LIMITES.length > 0 && (
        <>
          <h2 className="font-display text-2xl text-ink mt-6 mb-1">Communes en limite de zone</h2>
          <p className="font-body text-xs text-muted mb-3">
            Juste au-delà de la limite définie (Plougasnou - Carhaix à l'est, Crozon - Châteaulin au sud).
          </p>
          {LIMITES.map((g) => (
            <Groupe key={g.titre} {...g} selection={selection} onToggle={toggle} onSet={setMany} />
          ))}
        </>
      )}
    </div>
  )
}

export default function DeliveryZonePanel() {
  const { settings, loading, updateSettings } = useSiteSettings()
  if (loading || !settings) return <p className="font-body text-sm text-muted">Chargement…</p>
  return (
    <ZoneEditor
      initial={settings.zone_livraison || []}
      onSave={(communes) => updateSettings({ zone_livraison: communes })}
    />
  )
}
