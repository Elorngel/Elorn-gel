import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { correspond } from '../lib/texte'
import { finPrivilege, privilegeActif, aujourdhuiParis } from '../../supabase/functions/_shared/calculCommande.js'

const age = (date) => {
  const n = new Date(`${date}T12:00:00`)
  const a = new Date()
  let ans = a.getFullYear() - n.getFullYear()
  if (a.getMonth() < n.getMonth() || (a.getMonth() === n.getMonth() && a.getDate() < n.getDate())) ans--
  return ans
}
const dateFr = (d) => new Date(d).toLocaleDateString('fr-FR')

// Carte Privilège (39 € par an, vendue hors site) : l'admin coche la case et note la date d'achat ; le client a la
// livraison offerte pendant 1 an (jusqu'à la veille du même jour l'année suivante). Rien n'en parle sur le site.
function CellulePrivilege({ client, onChange }) {
  const [enCours, setEnCours] = useState(false)
  const debut = client.privilege_debut
  const actif = privilegeActif(debut)
  const fin = finPrivilege(debut)

  const enregistrer = async (date) => {
    setEnCours(true)
    const { error } = await supabase.rpc('definir_privilege', { p_client: client.id, p_debut: date })
    setEnCours(false)
    if (error) return alert(`Erreur : ${error.message}`)
    onChange(date)
  }

  return (
    <div className="min-w-[150px]">
      <label className="flex items-center gap-1.5 font-tag text-xs uppercase cursor-pointer">
        <input
          type="checkbox"
          checked={!!debut}
          disabled={enCours}
          onChange={(e) => {
            if (e.target.checked) enregistrer(aujourdhuiParis())
            else if (confirm(`Retirer la carte Privilège de ${client.prenom} ${client.nom} ?`)) enregistrer(null)
          }}
          className="w-4 h-4 accent-forest"
        />
        Privilège
      </label>
      {debut && (
        <>
          <label className="block font-tag text-[10px] uppercase text-muted mt-1">
            Achetée le
            <input
              type="date"
              value={debut}
              max={aujourdhuiParis()}
              disabled={enCours}
              onChange={(e) => e.target.value && enregistrer(e.target.value)}
              className="block border border-ink/30 bg-paper px-1 py-0.5 font-body text-xs normal-case focus:border-forest focus:outline-none"
            />
          </label>
          <span className={`block font-tag text-[11px] mt-0.5 ${actif ? 'text-forest' : 'text-rust'}`}>
            {actif ? `Livraison offerte jusqu'au ${dateFr(`${fin}T12:00:00`)}` : `Expirée le ${dateFr(`${fin}T12:00:00`)}`}
          </span>
        </>
      )}
    </div>
  )
}

// Liste des comptes clients (visible uniquement par un administrateur connecté : la base
// refuse de la donner à quelqu'un d'autre).
export default function ClientsPanel() {
  const [clients, setClients] = useState(null)
  const [nbCommandes, setNbCommandes] = useState({})
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('commandes').select('client_id').not('client_id', 'is', null),
    ]).then(([{ data: c }, { data: cmd }]) => {
      const compte = {}
      ;(cmd || []).forEach((x) => {
        compte[x.client_id] = (compte[x.client_id] || 0) + 1
      })
      setNbCommandes(compte)
      setClients(c || [])
    })
  }, [])

  const visibles = useMemo(() => {
    const q = recherche.trim()
    if (!clients) return []
    if (!q) return clients
    return clients.filter((c) =>
      correspond([c.nom, c.prenom, c.email, c.telephone, c.ville].join(' '), q)
    )
  }, [clients, recherche])

  if (clients === null) return <p className="font-body text-sm text-muted">Chargement…</p>

  const moisCourant = new Date().getMonth()
  const anniversairesDuMois = clients.filter((c) => new Date(`${c.date_naissance}T12:00:00`).getMonth() === moisCourant)
  const optin = clients.filter((c) => c.accepte_offres).length
  const privileges = clients.filter((c) => privilegeActif(c.privilege_debut)).length
  const majPrivilege = (id, date) =>
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, privilege_debut: date } : c)))

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher (nom, email, téléphone, ville)…"
          className="border border-ink/30 px-3 py-2 font-body text-sm w-full max-w-xs focus:border-forest focus:outline-none"
        />
        <p className="font-tag text-xs uppercase text-muted">
          {clients.length} compte{clients.length > 1 ? 's' : ''} · {optin} accepte{optin > 1 ? 'nt' : ''} les offres ·{' '}
          {anniversairesDuMois.length} anniversaire{anniversairesDuMois.length > 1 ? 's' : ''} ce mois-ci ·{' '}
          {privileges} client{privileges > 1 ? 's' : ''} Privilège
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="font-body text-sm text-muted">
          Aucun compte client pour le moment. Ils se créent lors de la première commande.
        </p>
      ) : (
        <div className="bg-paper border border-ink/15 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/15 font-tag text-[11px] uppercase text-muted">
                <th className="p-2">Client</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Naissance</th>
                <th className="p-2">Adresse</th>
                <th className="p-2">Privilège</th>
                <th className="p-2">Offres</th>
                <th className="p-2">Connu par</th>
                <th className="p-2">Inscrit le</th>
                <th className="p-2 text-right">Commandes</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => (
                <tr key={c.id} className="border-b border-ink/10 align-top">
                  <td className="p-2 font-body font-semibold">
                    {c.nom.toUpperCase()} {c.prenom}
                  </td>
                  <td className="p-2 font-body">
                    {c.email}
                    <span className="block text-muted">{c.telephone}</span>
                  </td>
                  <td className="p-2 font-tag text-xs">
                    {dateFr(`${c.date_naissance}T12:00:00`)}
                    <span className="block text-muted">{age(c.date_naissance)} ans</span>
                  </td>
                  <td className="p-2 font-body text-xs">
                    {c.adresse}
                    {c.complement ? `, ${c.complement}` : ''}
                    <span className="block">
                      {c.code_postal} {c.ville}
                    </span>
                  </td>
                  <td className="p-2">
                    <CellulePrivilege client={c} onChange={(date) => majPrivilege(c.id, date)} />
                  </td>
                  <td className="p-2 font-tag text-xs">{c.accepte_offres ? 'Oui' : 'Non'}</td>
                  <td className="p-2 font-tag text-xs">{c.source || '—'}</td>
                  <td className="p-2 font-tag text-xs">{dateFr(c.created_at)}</td>
                  <td className="p-2 font-tag text-xs text-right">{nbCommandes[c.id] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
