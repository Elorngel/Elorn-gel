import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { usePriceMode } from '../context/PriceModeContext'
import { useOrder } from '../hooks/useOrder'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { getDatesDisponibles, getCreneauxDisponibles } from '../lib/pickupSlots'
import { getBasePrice } from '../lib/pricing'
import { printBonDeCommande } from '../lib/printOrder'
import { verifierZoneLivraison } from '../lib/zoneLivraison'
import { DEFAULT_TELEPHONE } from '../lib/siteDefaults'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CroppableImage from '../components/CroppableImage'
import ChampsCompte, { COMPTE_VIDE } from '../components/ChampsCompte'
import { useAuth } from '../context/AuthContext'


export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart()
  const { mode, setMode, isPickup, getPickupPrice, discountPercent } = usePriceMode()
  const { submitOrder, submitting, error } = useOrder()
  const { settings } = useSiteSettings()

  const { user, client, estAdmin, chargement: authChargement, connexion, creerCompte, deconnexion } = useAuth()

  // Coordonnées de la commande. null = reprendre celles du compte connecté.
  const [nomClient, setNomClient] = useState(null)
  const [telephone, setTelephone] = useState(null)
  const [email, setEmail] = useState(null)
  const [note, setNote] = useState('')
  const [adresseLivraison, setAdresseLivraison] = useState(null)
  const [codePostal, setCodePostal] = useState(null)
  const [ville, setVille] = useState(null)

  // Pas encore connecté : créer son compte (dans ce formulaire) ou se connecter.
  const [onglet, setOnglet] = useState('creation')
  const [compte, setCompte] = useState(COMPTE_VIDE)
  const [connexionEmail, setConnexionEmail] = useState('')
  const [connexionMdp, setConnexionMdp] = useState('')
  const [erreurCompte, setErreurCompte] = useState('')
  const [compteEnCours, setCompteEnCours] = useState(false)
  const majCompte = (champ, valeur) => setCompte((c) => ({ ...c, [champ]: valeur }))

  // D'où viennent les coordonnées : compte client, nouveau compte, ou saisie libre
  // (administrateur qui prend une commande par téléphone).
  const source = user ? (client ? 'compte' : 'libre') : 'creation'
  const coord = {
    nom:
      source === 'creation'
        ? `${compte.prenom} ${compte.nom}`.trim()
        : nomClient ?? (client ? `${client.prenom} ${client.nom}` : ''),
    telephone: source === 'creation' ? compte.telephone : telephone ?? client?.telephone ?? '',
    email: source === 'creation' ? compte.email : source === 'compte' ? client.email : email ?? '',
    adresse: source === 'creation' ? compte.adresse : adresseLivraison ?? client?.adresse ?? '',
    codePostal: source === 'creation' ? compte.codePostal : codePostal ?? client?.code_postal ?? '',
    ville: source === 'creation' ? compte.ville : ville ?? client?.ville ?? '',
  }
  const [pickupDate, setPickupDate] = useState('')
  const [pickupSlot, setPickupSlot] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryWindow, setDeliveryWindow] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState(null)
  const [confirmedLignes, setConfirmedLignes] = useState([])

  const unitPrice = (item) => {
    const base = getBasePrice(item)
    return isPickup ? getPickupPrice(base) : base
  }

  const subtotal = items.reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0)
  const deliveryFee = !isPickup ? settings?.frais_livraison ?? 7 : 0
  const total = subtotal + deliveryFee

  // Jours et créneaux proposés : calendrier réglé dans l'admin (jours fermés, créneaux
  // indisponibles selon le jour de la semaine).
  const calendrier = {
    joursFermes: settings?.jours_fermes,
    indispo: settings?.creneaux_indisponibles,
    speciaux: settings?.horaires_speciaux,
  }
  const pickupDates = getDatesDisponibles('retrait', calendrier)
  const deliveryDates = getDatesDisponibles('livraison', calendrier)
  // Une date ou un créneau qui n'est plus proposé (réglages chargés entre-temps) est ignoré.
  const pickupDateOk = pickupDates.some((d) => d.value === pickupDate) ? pickupDate : ''
  const deliveryDateOk = deliveryDates.some((d) => d.value === deliveryDate) ? deliveryDate : ''
  const pickupSlots = getCreneauxDisponibles('retrait', pickupDateOk, calendrier)
  const deliveryWindows = getCreneauxDisponibles('livraison', deliveryDateOk, calendrier)
  const pickupSlotOk = pickupSlots.includes(pickupSlot) ? pickupSlot : ''
  const deliveryWindowOk = deliveryWindows.includes(deliveryWindow) ? deliveryWindow : ''

  const pickupDateLabel = (value) =>
    pickupDates.find((d) => d.value === value)?.label || value

  const deliveryDateLabel = (value) =>
    deliveryDates.find((d) => d.value === value)?.label || value

  // Zone de livraison (réglée dans l'admin) : ne concerne que la livraison.
  const zone = !isPickup ? verifierZoneLivraison(settings?.zone_livraison, coord.codePostal, coord.ville) : { ok: true }
  const cpComplet = coord.codePostal.trim().length === 5
  const livraisonRefusee = !isPickup && !zone.ok && (cpComplet || zone.raison === 'commune')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) return
    if (livraisonRefusee) return
    setErreurCompte('')

    if (!user) {
      setCompteEnCours(true)
      try {
        if (onglet === 'connexion') {
          // Une fois connecté, le formulaire se remplit avec le compte : le client vérifie et valide.
          await connexion(connexionEmail, connexionMdp)
          return
        }
        await creerCompte(compte)
      } catch (err) {
        setErreurCompte(err.message)
        return
      } finally {
        setCompteEnCours(false)
      }
    }

    const lignesPourRecap = items.map((item) => ({
      nom: item.nom,
      unitPrice: unitPrice(item),
      quantity: item.quantity,
    }))

    try {
      const commande = await submitOrder({
        nomClient: coord.nom,
        telephone: coord.telephone,
        email: coord.email,
        mode,
        note,
        adresseLivraison: !isPickup
          ? [coord.adresse.trim(), (source === 'creation' ? compte.complement : client?.complement)?.trim()]
              .filter(Boolean)
              .join(', ')
          : null,
        codePostal: !isPickup ? coord.codePostal.trim() : null,
        ville: !isPickup ? coord.ville.trim() : null,
        creneauRetrait: isPickup ? `${pickupDateLabel(pickupDateOk)} · ${pickupSlotOk}` : null,
        creneauLivraison: !isPickup ? `${deliveryDateLabel(deliveryDateOk)} · ${deliveryWindowOk}` : null,
        total,
        fraisLivraison: deliveryFee,
        items: lignesPourRecap,
      })
      setConfirmedOrder(commande)
      setConfirmedLignes(lignesPourRecap)
      clear()
    } catch {
      // l'erreur est déjà exposée via le hook useOrder
    }
  }

  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-stone">
        <Header activeCategory={null} />
        <div className="max-w-2xl mx-auto px-5 py-12">
          <div className="text-center mb-6">
            <h1 className="font-display text-4xl text-forest mb-3">
              Commande enregistrée
            </h1>
            <p className="font-body text-sm text-ink mb-1">
              Merci {confirmedOrder.nom_client}, on prépare tout ça.
            </p>
            <p className="font-body text-sm text-muted">
              {confirmedOrder.mode === 'retrait'
                ? `Rendez-vous au dépôt le ${confirmedOrder.creneau_retrait || 'créneau choisi'}.`
                : `Livraison prévue le ${confirmedOrder.creneau_livraison || 'créneau choisi'}.`}{' '}
              Le paiement se fait sur place, à {confirmedOrder.mode === 'retrait' ? 'la récupération' : 'la livraison'}.
            </p>
          </div>

          <div className="bg-paper border border-ink/15 p-4 mb-6">
            <h2 className="font-display text-xl text-ink mb-3">Récapitulatif</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="font-tag text-[11px] uppercase text-muted border-b border-ink/15">
                  <th className="text-left py-1.5">Produit</th>
                  <th className="text-right py-1.5">Qté</th>
                  <th className="text-right py-1.5">Prix</th>
                </tr>
              </thead>
              <tbody>
                {confirmedLignes.map((l, i) => (
                  <tr key={i} className="border-b border-ink/10 last:border-b-0">
                    <td className="py-1.5 font-body">{l.nom}</td>
                    <td className="py-1.5 text-right font-tag">{l.quantity}</td>
                    <td className="py-1.5 text-right font-tag">
                      {(l.unitPrice * l.quantity).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {confirmedOrder.frais_livraison > 0 && (
              <div className="flex justify-between font-body text-sm mt-2 pt-2 border-t border-ink/10">
                <span>Frais de livraison</span>
                <span>{confirmedOrder.frais_livraison.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-ink/15">
              <span className="font-tag text-xs uppercase text-muted">Total</span>
              <span className="font-display text-2xl text-ink">
                {confirmedOrder.total.toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => printBonDeCommande(confirmedOrder, confirmedLignes)}
              className="border border-ink/40 font-tag text-xs font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-stone transition-colors"
            >
              Imprimer le bon de commande
            </button>
            <a
              href="#"
              className="inline-block bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-forest transition-colors"
            >
              Retour au catalogue
            </a>
          </div>
        </div>
        <Footer />
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
                  <span>{mode === 'retrait' ? `Retrait${discountPercent > 0 ? ` -${discountPercent}%` : ''}` : 'Livraison'}</span>
                </div>
                <div className="flex justify-between font-body text-sm text-ink pt-2 border-t border-ink/15">
                  <span>Sous-total</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between font-body text-sm text-ink mt-1">
                    <span>Frais de livraison</span>
                    <span>{deliveryFee.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-ink/15">
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

                {authChargement ? (
                  <p className="font-body text-sm text-muted">Chargement…</p>
                ) : !user ? (
                  <>
                    <p className="font-body text-sm text-muted">
                      Un compte est nécessaire pour commander : il garde vos coordonnées et
                      l'historique de vos commandes.
                    </p>
                    <div className="grid grid-cols-2 border border-ink/30 font-tag text-xs font-semibold uppercase">
                      {[
                        ['creation', 'Je crée mon compte'],
                        ['connexion', "J'ai déjà un compte"],
                      ].map(([valeur, label]) => (
                        <button
                          key={valeur}
                          type="button"
                          onClick={() => {
                            setOnglet(valeur)
                            setErreurCompte('')
                          }}
                          className={`py-2 ${onglet === valeur ? 'bg-ink text-paper' : 'text-ink hover:bg-stone'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {onglet === 'creation' ? (
                      <ChampsCompte valeurs={compte} onChange={majCompte} idPrefixe="panier" />
                    ) : (
                      <div className="flex flex-col gap-3">
                        <input
                          required
                          type="email"
                          autoComplete="email"
                          placeholder="Email"
                          value={connexionEmail}
                          onChange={(e) => setConnexionEmail(e.target.value)}
                          className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                        />
                        <input
                          required
                          type="password"
                          autoComplete="current-password"
                          placeholder="Mot de passe"
                          value={connexionMdp}
                          onChange={(e) => setConnexionMdp(e.target.value)}
                          className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                        />
                        <p className="font-body text-xs text-muted">
                          Mot de passe oublié ? Appelez-nous au{' '}
                          {settings?.contact_telephone || DEFAULT_TELEPHONE}.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-body text-sm text-ink">
                      {source === 'compte'
                        ? `Connecté : ${client.prenom} ${client.nom} (${client.email}).`
                        : estAdmin
                          ? "Commande saisie par l'administration (par exemple pour un client au téléphone)."
                          : 'Connecté.'}{' '}
                      <button type="button" onClick={deconnexion} className="underline text-muted hover:text-ink">
                        Se déconnecter
                      </button>
                    </p>
                    <input
                      required
                      type="text"
                      placeholder="Nom et prénom"
                      value={coord.nom}
                      onChange={(e) => setNomClient(e.target.value)}
                      className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="Téléphone"
                      value={coord.telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                    />
                    {source === 'libre' && (
                      <input
                        type="email"
                        placeholder="Email (facultatif)"
                        value={coord.email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                      />
                    )}
                    {!isPickup && (
                      <div className="flex flex-col gap-3">
                        <p className="font-tag text-[11px] uppercase text-forest font-semibold">
                          Adresse de livraison
                        </p>
                        <input
                          required
                          type="text"
                          placeholder="Adresse (numéro et rue)"
                          value={coord.adresse}
                          onChange={(e) => setAdresseLivraison(e.target.value)}
                          className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                        />
                        <div className="grid grid-cols-[110px_1fr] gap-3">
                          <input
                            required
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{5}"
                            maxLength={5}
                            placeholder="Code postal"
                            value={coord.codePostal}
                            onChange={(e) => setCodePostal(e.target.value)}
                            className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                          />
                          <input
                            required
                            type="text"
                            placeholder="Ville"
                            value={coord.ville}
                            onChange={(e) => setVille(e.target.value)}
                            className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!isPickup && livraisonRefusee && cpComplet && (
                  <div className="border border-rust bg-rust/5 p-3" role="alert">
                    {zone.raison === 'code' ? (
                      <p className="font-body text-sm text-ink">
                        Désolé, nous ne livrons pas encore à cette adresse (code postal{' '}
                        <strong>{coord.codePostal.trim()}</strong>). Vous pouvez choisir le
                        retrait au dépôt, ou nous appeler au{' '}
                        {settings?.contact_telephone || DEFAULT_TELEPHONE}.
                      </p>
                    ) : (
                      <p className="font-body text-sm text-ink">
                        Ce code postal est partagé par plusieurs communes, et nous ne livrons
                        que : <strong>{zone.desservies.join(', ')}</strong>. Indiquez le nom de
                        votre commune dans « Ville », ou choisissez le retrait au dépôt.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setMode('retrait')}
                      className="mt-2 border border-ink font-tag text-xs font-semibold uppercase px-3 py-1.5 hover:bg-stone"
                    >
                      Passer en retrait au dépôt
                    </button>
                  </div>
                )}

                {!(!user && onglet === 'connexion') && (
                <>
                <textarea
                  placeholder="Note (optionnel — étage, digicode…)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none"
                />

                {isPickup ? (
                  <div className="border-t border-ink/15 pt-3 mt-1">
                    <p className="font-tag text-[11px] uppercase text-forest font-semibold mb-2">
                      Commande disponible sous 24h au dépôt
                    </p>

                    <label className="block font-tag text-[11px] uppercase text-muted mb-1">
                      Jour de retrait
                    </label>
                    <select
                      required
                      value={pickupDateOk}
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
                      value={pickupSlotOk}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      disabled={!pickupDateOk}
                      className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none disabled:bg-stone disabled:text-muted"
                    >
                      <option value="" disabled>
                        {pickupDateOk ? '— choisir un créneau —' : "— choisir d'abord un jour —"}
                      </option>
                      {pickupSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="border-t border-ink/15 pt-3 mt-1">
                    <p className="font-tag text-[11px] uppercase text-forest font-semibold mb-2">
                      Livraison disponible sous 24h
                    </p>

                    <label className="block font-tag text-[11px] uppercase text-muted mb-1">
                      Jour de livraison
                    </label>
                    <select
                      required
                      value={deliveryDateOk}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full border border-ink/20 p-2 font-body text-sm mb-3 focus:border-forest focus:outline-none"
                    >
                      <option value="" disabled>
                        — choisir un jour —
                      </option>
                      {deliveryDates.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>

                    <label className="block font-tag text-[11px] uppercase text-muted mb-1">
                      Créneau
                    </label>
                    <select
                      required
                      value={deliveryWindowOk}
                      onChange={(e) => setDeliveryWindow(e.target.value)}
                      disabled={!deliveryDateOk}
                      className="w-full border border-ink/20 p-2 font-body text-sm focus:border-forest focus:outline-none disabled:bg-stone disabled:text-muted"
                    >
                      <option value="" disabled>
                        {deliveryDateOk ? '— choisir un créneau —' : "— choisir d'abord un jour —"}
                      </option>
                      {deliveryWindows.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="font-tag text-[11px] text-muted">
                  Paiement sur place, à{' '}
                  {mode === 'retrait' ? 'la récupération de la commande' : 'la livraison'}.
                </p>
                </>
                )}

                {erreurCompte && (
                  <p className="font-body text-sm text-rust" role="alert">
                    {erreurCompte}
                  </p>
                )}

                {error && (
                  <p className="font-body text-sm text-rust">
                    Une erreur est survenue : {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || compteEnCours || livraisonRefusee || authChargement}
                  className="bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-forest transition-colors disabled:bg-muted"
                >
                  {submitting || compteEnCours
                    ? 'Envoi…'
                    : user
                      ? 'Valider la commande'
                      : onglet === 'connexion'
                        ? 'Se connecter'
                        : 'Créer mon compte et valider la commande'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
