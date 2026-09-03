import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { usePriceMode } from '../context/PriceModeContext'
import { useOrder } from '../hooks/useOrder'
import { getAvailablePickupDates, getPickupTimeSlots } from '../lib/pickupSlots'
import { getBasePrice } from '../lib/pricing'
import Header from '../components/Header'
import CroppableImage from '../components/CroppableImage'

const pickupDates = getAvailablePickupDates()
const pickupSlots = getPickupTimeSlots()

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart()
  const { mode, isPickup, getPickupPrice, discountPercent } = usePriceMode()
  const { submitOrder, submitting, error } = useOrder()

  const [nomClient, setNomClient] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupSlot, setPickupSlot] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState(null)

  const unitPrice = (item) => {
    const base = getBasePrice(item)
    return isPickup ? getPickupPrice(base) : base
  }

  const total = items.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0)

  const pickupDateLabel = (value) =>
    pickupDates.find((d) => d.value === value)?.label || value

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return

    try {
      const commande = await submitOrder({
        nomClient,
        telephone,
        email,
        mode,
        note,
        creneauRetrait: isPickup ? `${pickupDateLabel(pickupDate)} · ${pickupSlot}` : null,
        total,
        items: items.map((item) => ({
          id: item.id,
          nom: item.nom,
          unitPrice: unitPrice(item),
          quantity: item.quantity,
        })),
      })
      setConfirmedOrder(commande)
      clear()
    } catch {
      // l'erreur est déjà exposée via le hook useOrder
    }
  }

  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-stone">
        <Header activeCategory={null} />
        <div className="max-w-2xl mx-auto px-5 py-16 text-center">
          <h1 className="font-display text-4xl text-forest mb-3">
            Commande enregistrée
          </h1>
          <p className="font-body text-sm text-ink mb-1">
            Merci {confirmedOrder.nom_client}, on prépare tout ça.
          </p>
          <p className="font-body text-sm text-muted mb-6">
            {confirmedOrder.mode === 'retrait'
              ? `Rendez-vous au dépôt le ${confirmedOrder.creneau_retrait || 'créneau choisi'}.`
              : 'Vous serez contacté pour organiser la livraison.'}{' '}
            Le paiement se fait sur place, à {confirmedOrder.mode === 'retrait' ? 'la récupération' : 'la livraison'}.
          </p>
          <a
            href="#"
            className="inline-block bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-forest transition-colors"
          >
            Retour au catalogue
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone">
      <Header activeCategory={null} />
      <div className="max-w-4xl mx-auto px-5 py-6">
        <h1 className="font-display text-3xl text-ink mb-5">Votre panier</h1>

        {items.length === 0 ? (
          <p className="font-body text-sm text-muted">
            Ton panier est vide.{' '}
            <a href="#" className="underline">
              Retour au catalogue
            </a>
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8">
            <div className="bg-paper border border-ink/15">
              {items.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex gap-3 p-3 border-b border-ink/10 last:border-b-0"
                >
                  <a
                    href={`#produit/${item.id}`}
                    className="relative w-16 h-16 bg-stone overflow-hidden shrink-0"
                  >
                    {item.photo_url && (
                      <CroppableImage
                        src={item.photo_url}
                        alt={item.nom}
                        zoom={item.photo_zoom ?? 1}
                        posX={item.photo_pos_x ?? 50}
                        posY={item.photo_pos_y ?? 50}
                      />
                    )}
                  </a>

                  <div className="flex-1 min-w-0">
                    <a href={`#produit/${item.id}`}>
                      <h3 className="font-body font-semibold text-sm hover:underline truncate">
                        {item.nom}
                      </h3>
                    </a>
                    {item.poids && (
                      <p className="font-tag text-[11px] text-muted">{item.poids}</p>
                    )}
                    <p className="font-display text-lg text-ink mt-1">
                      {unitPrice(item).toFixed(2)} €
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      className="font-tag text-[11px] uppercase text-muted hover:text-rust"
                    >
                      Retirer
                    </button>
                    <div className="flex items-center border border-ink/30">
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        className="w-7 h-7 font-display text-base hover:bg-stone"
                        aria-label="Diminuer"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-body text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="w-7 h-7 font-display text-base hover:bg-stone"
                        aria-label="Augmenter"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="bg-paper border border-ink/15 p-4 mb-4">
                <div className="flex justify-between font-tag text-xs uppercase text-muted mb-1">
                  <span>Mode</span>
                  <span>{mode === 'retrait' ? `Retrait -${discountPercent}%` : 'Livraison'}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-ink/15">
                  <span className="font-tag text-xs uppercase text-muted">Total</span>
                  <span className="font-display text-3xl text-ink">
                    {total.toFixed(2)} €
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="bg-paper border border-ink/15 p-4 flex flex-col gap-3"
              >
                <h2 className="font-display text-xl text-ink mb-1">Vos coordonnées</h2>

                <input
                  required
                  type="text"
                  placeholder="Nom et prénom"
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                />
                <input
                  required
                  type="tel"
                  placeholder="Téléphone"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email (optionnel)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                />
                <textarea
                  placeholder="Note (optionnel)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                />

                {isPickup && (
                  <div className="border-t border-ink/15 pt-3 mt-1">
                    <p className="font-tag text-[11px] uppercase text-forest font-semibold mb-2">
                      Commande disponible sous 24h au dépôt
                    </p>

                    <label className="block font-tag text-[11px] uppercase text-muted mb-1">
                      Jour de retrait
                    </label>
                    <select
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full border border-ink/20 p-2 font-body text-sm mb-3 focus:border-forest focus:outline-none"
                    >
                      <option value="" disabled>
                        — choisir un jour —
                      </option>
                      {pickupDates.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>

                    <label className="block font-tag text-[11px] uppercase text-muted mb-1">
                      Créneau horaire
                    </label>
                    <select
                      required
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                    >
                      <option value="" disabled>
                        — choisir un créneau —
                      </option>
                      {pickupSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="font-tag text-[11px] text-muted">
                  Paiement sur place, à{' '}
                  {mode === 'retrait' ? 'la récupération de la commande' : 'la livraison'}.
                </p>

                {error && (
                  <p className="font-body text-sm text-rust">
                    Une erreur est survenue : {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted"
                >
                  {submitting ? 'Envoi…' : 'Valider la commande'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
