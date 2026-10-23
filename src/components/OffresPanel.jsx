import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { MOTIFS_BON, euros } from '../lib/offres'

const champ = 'border border-ink/20 p-1.5 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const etiquette = 'block font-tag text-[10px] uppercase text-muted mb-1'
const bouton =
  'bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-3 py-2 hover:bg-forest disabled:bg-muted'
const NOUVEAU = { code: '', pourcentage: '', max_utilisations: '', debut: '', fin: '' }
const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '')

function Cadre({ titre, children }) {
  return (
    <section className="bg-paper border border-ink/15 p-4 mb-5">
      <h2 className="font-display text-2xl text-ink mb-3">{titre}</h2>
      {children}
    </section>
  )
}

function CodesPromo() {
  const [codes, setCodes] = useState(null)
  const [utilisations, setUtilisations] = useState({})
  const [nouveau, setNouveau] = useState(NOUVEAU)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const [{ data }, { data: u }] = await Promise.all([
      supabase.from('codes_promo').select('*').order('created_at', { ascending: false }),
      supabase.rpc('utilisations_codes_promo'),
    ])
    setCodes(data || [])
    setUtilisations(Object.fromEntries((u || []).map((x) => [x.code, Number(x.utilisations)])))
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  const modifier = async (id, changes) => {
    const { error } = await supabase.from('codes_promo').update(changes).eq('id', id)
    if (error) alert(`Erreur : ${error.message}`)
    charger()
  }

  const creer = async (e) => {
    e.preventDefault()
    setErreur('')
    const code = nouveau.code.trim().toUpperCase()
    if (!/^[A-Z0-9]{3,30}$/.test(code)) {
      setErreur('Le code doit faire 3 à 30 caractères, lettres et chiffres seulement (sans espace ni accent).')
      return
    }
    const { error } = await supabase.from('codes_promo').insert({
      code,
      pourcentage: Number(nouveau.pourcentage),
      max_utilisations: nouveau.max_utilisations ? Number(nouveau.max_utilisations) : null,
      debut: nouveau.debut || null,
      fin: nouveau.fin || null,
    })
    if (error) {
      setErreur(error.code === '23505' ? 'Ce code existe déjà.' : `Erreur : ${error.message}`)
      return
    }
    setNouveau(NOUVEAU)
    charger()
  }

  return (
    <Cadre titre="Codes promo">
      <p className="font-body text-xs text-muted mb-3">
        Le client tape le code dans son panier. La remise s'applique sur les produits (après promos, déstockage et
        remise retrait ; pas sur les frais de livraison). Chaque code ne sert qu'une fois par compte client.
      </p>
      {codes === null ? (
        <p className="font-body text-sm text-muted">Chargement…</p>
      ) : (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="font-tag text-[10px] uppercase text-muted border-b border-ink/15 text-left">
              <th className="py-1.5">Code</th>
              <th className="py-1.5">Remise</th>
              <th className="py-1.5">Utilisé</th>
              <th className="py-1.5">Période</th>
              <th className="py-1.5 text-right">Actif</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => {
              const n = utilisations[c.code] || 0
              return (
                <tr key={c.id} className="border-b border-ink/10">
                  <td className="py-2 font-tag font-semibold">{c.code}</td>
                  <td className="py-2 font-tag">-{Number(c.pourcentage)} %</td>
                  <td className="py-2 font-tag">
                    {n}
                    {c.max_utilisations ? ` / ${c.max_utilisations}` : ''}
                    {c.max_utilisations && n >= c.max_utilisations && (
                      <span className="ml-1 text-rust uppercase text-[10px]">épuisé</span>
                    )}
                  </td>
                  <td className="py-2 font-body text-xs text-muted">
                    {c.debut || c.fin ? `${c.debut ? `du ${dateFr(c.debut)} ` : ''}${c.fin ? `au ${dateFr(c.fin)}` : ''}` : 'Sans limite'}
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="checkbox"
                      checked={c.actif}
                      onChange={(e) => modifier(c.id, { actif: e.target.checked })}
                      className="w-4 h-4 accent-forest"
                      aria-label={`Code ${c.code} actif`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <form onSubmit={creer} className="border-t border-ink/15 pt-3">
        <p className="font-tag text-xs uppercase text-muted mb-2">Nouveau code</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className={etiquette} htmlFor="code-nouveau">Code</label>
            <input
              id="code-nouveau"
              required
              value={nouveau.code}
              onChange={(e) => setNouveau({ ...nouveau, code: e.target.value.toUpperCase() })}
              className={`${champ} w-36 uppercase`}
              placeholder="NOEL15"
            />
          </div>
          <div>
            <label className={etiquette} htmlFor="code-pct">Remise %</label>
            <input
              id="code-pct"
              required
              type="number"
              min="1"
              max="100"
              value={nouveau.pourcentage}
              onChange={(e) => setNouveau({ ...nouveau, pourcentage: e.target.value })}
              className={`${champ} w-20`}
            />
          </div>
          <div>
            <label className={etiquette} htmlFor="code-max">Utilisations max</label>
            <input
              id="code-max"
              type="number"
              min="1"
              placeholder="illimité"
              value={nouveau.max_utilisations}
              onChange={(e) => setNouveau({ ...nouveau, max_utilisations: e.target.value })}
              className={`${champ} w-28`}
            />
          </div>
          <div>
            <label className={etiquette} htmlFor="code-debut">Du (facultatif)</label>
            <input
              id="code-debut"
              type="date"
              value={nouveau.debut}
              onChange={(e) => setNouveau({ ...nouveau, debut: e.target.value })}
              className={champ}
            />
          </div>
          <div>
            <label className={etiquette} htmlFor="code-fin">Au (facultatif)</label>
            <input
              id="code-fin"
              type="date"
              value={nouveau.fin}
              onChange={(e) => setNouveau({ ...nouveau, fin: e.target.value })}
              className={champ}
            />
          </div>
          <button type="submit" className={bouton}>
            Créer le code
          </button>
        </div>
        {erreur && <p className="font-body text-sm text-rust mt-2">{erreur}</p>}
      </form>
    </Cadre>
  )
}

function ReglagesParrainage() {
  const { settings, updateSettings } = useSiteSettings()
  const [brouillon, setBrouillon] = useState({})
  if (!settings) return null

  const valeur = (c) => brouillon[c] ?? settings[c] ?? ''
  const enregistrer = (c) => {
    const v = Number(brouillon[c])
    if (brouillon[c] === undefined || isNaN(v) || v <= 0 || v === Number(settings[c])) return
    updateSettings({ [c]: c === 'parrainage_validite_mois' ? Math.round(v) : v })
  }
  const nombre = (c, label, unite, props = {}) => (
    <div>
      <label className={etiquette} htmlFor={`parrainage-${c}`}>{label}</label>
      <div className="flex items-center gap-1">
        <input
          id={`parrainage-${c}`}
          type="number"
          min="1"
          {...props}
          value={valeur(c)}
          onChange={(e) => setBrouillon({ ...brouillon, [c]: e.target.value })}
          onBlur={() => enregistrer(c)}
          className={`${champ} w-20 text-center`}
        />
        <span className="font-tag text-sm">{unite}</span>
      </div>
    </div>
  )

  return (
    <div className="flex flex-wrap gap-5 items-end mb-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.parrainage_actif !== false}
          onChange={(e) => updateSettings({ parrainage_actif: e.target.checked })}
          className="w-5 h-5 accent-forest"
        />
        <span className="font-body text-sm font-semibold">Parrainage actif</span>
      </label>
      {nombre('parrainage_montant', 'Montant du bon', '€', { step: '0.5' })}
      {nombre('parrainage_minimum', 'Minimum de commande', '€', { step: '1' })}
      {nombre('parrainage_validite_mois', 'Validité', 'mois', { step: '1' })}
    </div>
  )
}

function BonsEtParrainages() {
  const [bons, setBons] = useState(null)
  const [clients, setClients] = useState(new Map())

  useEffect(() => {
    Promise.all([
      supabase.from('bons_achat').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('clients').select('id, prenom, nom, code_parrain, parrain_id'),
    ]).then(([b, c]) => {
      setBons(b.data || [])
      setClients(new Map((c.data || []).map((x) => [x.id, x])))
    })
  }, [])

  const nom = (id) => {
    const c = clients.get(id)
    return c ? `${c.prenom} ${c.nom}` : '—'
  }
  const filleuls = [...clients.values()].filter((c) => c.parrain_id)
  const maintenant = new Date().toISOString()

  return (
    <>
      <p className="font-tag text-xs uppercase text-muted mb-2">Parrainages ({filleuls.length})</p>
      {filleuls.length === 0 ? (
        <p className="font-body text-sm text-muted mb-4">Aucun parrainage pour le moment.</p>
      ) : (
        <ul className="font-body text-sm mb-4 divide-y divide-ink/10 border-y border-ink/10">
          {filleuls.map((f) => (
            <li key={f.id} className="py-1.5">
              <strong>{nom(f.parrain_id)}</strong> a parrainé <strong>{f.prenom} {f.nom}</strong>
            </li>
          ))}
        </ul>
      )}

      <p className="font-tag text-xs uppercase text-muted mb-2">Bons d'achat</p>
      {bons === null ? (
        <p className="font-body text-sm text-muted">Chargement…</p>
      ) : bons.length === 0 ? (
        <p className="font-body text-sm text-muted">Aucun bon pour le moment.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="font-tag text-[10px] uppercase text-muted border-b border-ink/15 text-left">
              <th className="py-1.5">Client</th>
              <th className="py-1.5">Bon</th>
              <th className="py-1.5">Créé le</th>
              <th className="py-1.5 text-right">État</th>
            </tr>
          </thead>
          <tbody>
            {bons.map((b) => (
              <tr key={b.id} className="border-b border-ink/10">
                <td className="py-1.5 font-body">{nom(b.client_id)}</td>
                <td className="py-1.5 font-body">
                  {euros(b.montant)} · {MOTIFS_BON[b.motif]}
                  {b.filleul_id && <span className="text-muted"> (filleul : {nom(b.filleul_id)})</span>}
                </td>
                <td className="py-1.5 font-tag text-xs">{dateFr(b.created_at)}</td>
                <td className="py-1.5 font-tag text-xs text-right uppercase">
                  {b.commande_id ? (
                    <span className="text-muted">Utilisé</span>
                  ) : b.valable_jusqu_au < maintenant ? (
                    <span className="text-muted">Expiré</span>
                  ) : (
                    <span className="text-forest">Jusqu'au {dateFr(b.valable_jusqu_au)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default function OffresPanel() {
  return (
    <div className="max-w-4xl">
      <CodesPromo />
      <Cadre titre="Parrainage">
        <p className="font-body text-xs text-muted mb-3">
          Le filleul saisit le code de son parrain en créant son compte : son bon est créé tout de suite. Le bon du
          parrain est créé automatiquement quand vous passez la première commande du filleul (au moins le minimum,
          hors livraison) en « Livrée / Retirée ».
        </p>
        <ReglagesParrainage />
        <BonsEtParrainages />
      </Cadre>
    </div>
  )
}
