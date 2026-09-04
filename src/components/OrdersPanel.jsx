import { useState } from 'react'
import { useOrders } from '../hooks/useOrders'

const STATUTS = [
  { value: 'nouvelle', label: 'Nouvelle' },
  { value: 'preparee', label: 'Préparée' },
  { value: 'livree', label: 'Livrée / Retirée' },
]

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrdersPanel() {
  const { orders, loading, error, updateStatus } = useOrders()
  const [expanded, setExpanded] = useState(null)

  if (loading) {
    return <p className="font-body text-sm text-muted">Chargement des commandes…</p>
  }

  if (error) {
    return (
      <p className="font-body text-sm text-rust">
        Erreur : {error}. Vérifie que le script supabase-commandes.sql a bien été exécuté.
      </p>
    )
  }

  if (orders.length === 0) {
    return <p className="font-body text-sm text-muted">Aucune commande pour le moment.</p>
  }

  return (
    <div className="bg-paper border border-ink/15">
      {orders.map((order) => (
        <div key={order.id} className="border-b border-ink/10 last:border-b-0">
          <button
            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            className="w-full flex flex-wrap items-center gap-4 p-4 text-left hover:bg-stone/50"
          >
            <span className="font-tag text-xs text-muted w-32 shrink-0">
              {formatDate(order.created_at)}
            </span>
            <span className="font-body font-semibold text-sm flex-1 min-w-[140px]">
              {order.nom_client}
            </span>
            <span className="font-tag text-[11px] uppercase text-muted">
              {order.mode === 'retrait' ? 'Retrait' : 'Livraison'}
            </span>
            {(order.creneau_retrait || order.creneau_livraison) && (
              <span className="font-tag text-[11px] text-muted hidden sm:inline">
                {order.creneau_retrait || order.creneau_livraison}
              </span>
            )}
            <span className="font-display text-xl text-ink w-24 text-right shrink-0">
              {order.total.toFixed(2)} €
              {order.frais_livraison > 0 && (
                <span className="block font-tag text-[10px] text-muted normal-case">
                  dont {order.frais_livraison.toFixed(2)} € livr.
                </span>
              )}
            </span>

            <select
              value={order.statut}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateStatus(order.id, e.target.value)}
              className={`font-tag text-[11px] uppercase font-semibold px-2 py-1.5 border shrink-0 ${
                order.statut === 'livree'
                  ? 'border-forest text-forest'
                  : order.statut === 'preparee'
                    ? 'border-ink text-ink'
                    : 'border-rust text-rust'
              }`}
            >
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <span className="font-tag text-xs text-muted shrink-0">
              {expanded === order.id ? '▲' : '▼'}
            </span>
          </button>

          {expanded === order.id && (
            <div className="px-4 pb-4">
              <div className="bg-stone p-3 mb-3 font-body text-sm">
                <p>
                  <strong>Téléphone :</strong> {order.telephone}
                </p>
                {order.email && (
                  <p>
                    <strong>Email :</strong> {order.email}
                  </p>
                )}
                {order.note && (
                  <p>
                    <strong>Note :</strong> {order.note}
                  </p>
                )}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="font-tag text-[11px] uppercase text-muted border-b border-ink/10">
                    <th className="text-left py-1.5">Produit</th>
                    <th className="text-right py-1.5">Qté</th>
                    <th className="text-right py-1.5">Prix unit.</th>
                    <th className="text-right py-1.5">Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lignes.map((ligne) => (
                    <tr key={ligne.id} className="border-b border-ink/5 last:border-b-0">
                      <td className="py-1.5 font-body">{ligne.nom_produit}</td>
                      <td className="py-1.5 text-right font-tag">{ligne.quantite}</td>
                      <td className="py-1.5 text-right font-tag">
                        {ligne.prix_unitaire.toFixed(2)} €
                      </td>
                      <td className="py-1.5 text-right font-tag font-semibold">
                        {(ligne.prix_unitaire * ligne.quantite).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
