import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { usePriceMode } from '../context/PriceModeContext'
import { useOrder } from '../hooks/useOrder'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { getDatesDisponibles, getCreneauxDisponibles } from '../lib/pickupSlots'
import { calculerCommande, articleIndisponible } from '../../supabase/functions/_shared/calculCommande.js'
import { usePrixPanier, varianteDuPanier } from '../hooks/usePrixPanier'
import { supabase } from '../lib/supabaseClient'
import { printBonDeCommande } from '../lib/printOrder'
import { verifierZoneLivraison } from '../lib/zoneLivraison'
import { DEFAULT_TELEPHONE } from '../lib/siteDefaults'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CroppableImage from '../components/CroppableImage'
import ChampsCompte, { nouveauCompte } from '../components/ChampsCompte'
import { useAuth } from '../context/AuthContext'
import { MOTIFS_BON, euros, eurosTexte } from '../lib/offres'
import { urlProduit } from '../lib/adresses'
import { useSeo } from '../lib/seo'


export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart()
  useSeo({ titre: 'Votre panier', indexer: false })
  const { mode, setMode, isPickup, discountPercent } = usePriceMode()
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
  const [compte, setCompte] = useState(nouveauCompte)
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

  // Code promo saisi dans le panier (vérifié par la base, puis réappliqué par le serveur).
  const [codeSaisi, setCodeSaisi] = useState('')
  const [codeApplique, setCodeApplique] = useState(null)
  const [codeMessage, setCodeMessage] = useState('')
  const [codeEnCours, setCodeEnCours] = useState(false)

  // Bons d'achat du client connecté (parrainage…), utilisés automatiquement.
  const [bons, setBons] = useState([])
  const clientId = client?.id ?? null
  useEffect(() => {
    if (!clientId) return
    let annule = false
    supabase
      .from('bons_achat')
      .select('*')
      .eq('client_id', clientId)
      .is('commande_id', null)
      .gt('valable_jusqu_au', new Date().toISOString())
      .order('valable_jusqu_au', { ascending: true })
      .then(({ data }) => {
        if (!annule) setBons(data || [])
      })
    return () => {
      annule = true
    }
  }, [clientId])
  const bonsDispo = clientId ? bons : []

  // Prix à jour depuis la base, calculés exactement comme le fera le serveur.
  const prix = usePrixPanier(items)
  const lignesPanier = items.map((item) => {
    const produit = prix.produits.get(item.id)
    const varianteId = varianteDuPanier(item)
    const variante = varianteId ? prix.variantes.get(varianteId) : null
    const raison = !prix.pret
      ? ''
      : varianteId && !variante
        ? "Ce conditionnement n'existe plus."
        : articleIndisponible(produit, variante, mode)
    return { item, produit, variante, quantite: item.quantity, raison }
  })
  const lignesValides = prix.pret ? lignesPanier.filter((l) => !l.raison) : []
  const indisponibles = lignesPanier.filter((l) => l.raison)
  const parametresCalcul = {
    lignes: lignesValides,
    mode,
    remiseRetrait: settings?.remise_retrait ?? 0,
    fraisLivraison: settings?.frais_livraison ?? 7,
    code: codeApplique,
  }
  const sousTotalSansBon = calculerCommande(parametresCalcul).sousTotal
  const bon = bonsDispo.find((b) => sousTotalSansBon >= Number(b.minimum_commande || 0)) || null
  const bonEnAttente = !bon ? bonsDispo[0] : null
  const calcul = calculerCommande({ ...parametresCalcul, bon })
  const prixLigne = new Map(calcul.lignes.map((l) => [l.item.cartKey, l.prixUnitaire]))

  const appliquerCode = async () => {
    const code = codeSaisi.trim()
    if (!code) return
    setCodeEnCours(true)
    setCodeMessage('')
    const { data, error: errCode } = await supabase.rpc('verifier_code_promo', { p_code: code })
    setCodeEnCours(false)
    if (errCode || !data?.ok) {
      setCodeApplique(null)
      setCodeMessage(data?.message || 'Vérification du code impossible pour le moment.')
      return
    }
    setCodeApplique({ code: data.code, pourcentage: Number(data.pourcentage), restantes: data.restantes })
    setCodeSaisi('')
  }

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

    try {
      const commande = await submitOrder({
        mode,
        lignes: lignesValides.map((l) => ({
          produitId: l.produit.id,
          varianteId: l.variante?.id ?? null,
          quantite: l.quantite,
        })),
        nom: coord.nom,
        telephone: coord.telephone,
        email: coord.email,
        note,
        adresse: !isPickup
          ? [coord.adresse.trim(), (source === 'creation' ? compte.complement : client?.complement)?.trim()]
              .filter(Boolean)
              .join(', ')
          : null,
        codePostal: !isPickup ? coord.codePostal.trim() : null,
        ville: !isPickup ? coord.ville.trim() : null,
        creneau: isPickup
          ? `${pickupDateLabel(pickupDateOk)} · ${pickupSlotOk}`
          : `${deliveryDateLabel(deliveryDateOk)} · ${deliveryWindowOk}`,
        codePromo: codeApplique?.code ?? null,
        // Compte tout juste créé : un bon de parrainage a pu s'ajouter, le serveur fait foi.
        totalAttendu: source === 'creation' ? undefined : calcul.total,
      })
      setConfirmedOrder(commande)
      setCodeApplique(null)
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
                {confirmedOrder.commande_lignes.map((l) => (
                  <tr key={l.id} className="border-b border-ink/10 last:border-b-0">
                    <td className="py-1.5 font-body">{l.nom_produit}</td>
                    <td className="py-1.5 text-right font-tag">{l.quantite}</td>
                    <td className="py-1.5 text-right font-tag">{euros(l.prix_unitaire * l.quantite)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <LignesRemises commande={confirmedOrder} />
            <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-ink/15">
              <span className="font-tag text-xs uppercase text-muted">Total</span>
              <span className="font-display text-2xl text-ink">
                {euros(confirmedOrder.total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => printBonDeCommande(confirmedOrder, confirmedOrder.commande_lignes)}
              className="border border-ink/40 font-tag text-xs font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-stone transition-colors"
            >
              Imprimer le bon de commande
            </button>
            <a
              href="/"
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
            <a href="/" className="underline">
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
                    href={urlProduit({ id: item.id, nom: item.nom })}
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
                    <a href={urlProduit({ id: item.id, nom: item.nom })}>
                      <h3 className="font-body font-semibold text-sm hover:underline truncate">
                        {item.nom}
                      </h3>
                    </a>
                    {item.poids && (
                      <p className="font-tag text-[11px] text-muted">{item.poids}</p>
                    )}
                    {lignesPanier.find((l) => l.item.cartKey === item.cartKey)?.raison ? (
                      <p className="font-body text-xs text-rust mt-1">
                        {lignesPanier.find((l) => l.item.cartKey === item.cartKey).raison} Retirez-le pour commander.
                      </p>
                    ) : (
                      <p className="font-display text-lg text-ink mt-1">
                        {prixLigne.has(item.cartKey) ? euros(prixLigne.get(item.cartKey)) : '…'}
                      </p>
                    )}
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
                  <span>{prix.pret ? euros(calcul.sousTotal) : '…'}</span>
                </div>
                <LignesRemises
                  commande={{
                    code_promo: codeApplique?.code,
                    pourcentage: codeApplique?.pourcentage,
                    remise_code: calcul.remiseCode,
                    remise_bon: calcul.remiseBon,
                    motif_bon: bon?.motif,
                    frais_livraison: calcul.frais,
                  }}
                />
                <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-ink/15">
                  <span className="font-tag text-xs uppercase text-muted">Total</span>
                  <span className="font-display text-3xl text-ink">{prix.pret ? euros(calcul.total) : '…'}</span>
                </div>
                {bonEnAttente && (
                  <p className="font-body text-xs text-forest mt-2">
                    Vous avez un {MOTIFS_BON[bonEnAttente.motif]?.toLowerCase() || 'bon'} de {eurosTexte(bonEnAttente.montant)} :
                    il s'applique dès {eurosTexte(bonEnAttente.minimum_commande)} d'achats (encore{' '}
                    {euros(Math.max(0, bonEnAttente.minimum_commande - calcul.sousTotal))}).
                  </p>
                )}
                {prix.erreur && (
                  <p className="font-body text-xs text-rust mt-2">
                    Les prix n'ont pas pu être mis à jour : rechargez la page.
                  </p>
                )}
              </div>

              <div className="bg-paper border border-ink/15 p-4 mb-4">
                {codeApplique ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-body text-sm text-ink">
                      Code <strong>{codeApplique.code}</strong> : -{codeApplique.pourcentage} %
                      {codeApplique.restantes != null && (
                        <span className="block font-tag text-[11px] text-muted">
                          Plus que {codeApplique.restantes} utilisation{codeApplique.restantes > 1 ? 's' : ''} possible
                          {codeApplique.restantes > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCodeApplique(null)}
                      className="font-tag text-[11px] uppercase text-muted underline hover:text-rust"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      appliquerCode()
                    }}
                  >
                    <label htmlFor="code-promo" className="block font-tag text-[11px] uppercase text-muted mb-1">
                      Code promo
                    </label>
                    <div className="flex">
                      <input
                        id="code-promo"
                        type="text"
                        autoCapitalize="characters"
                        value={codeSaisi}
                        onChange={(e) => setCodeSaisi(e.target.value)}
                        className="flex-1 min-w-0 border border-ink/20 border-r-0 p-2 font-body text-sm uppercase focus:border-forest focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={codeEnCours || !codeSaisi.trim()}
                        className="border border-ink bg-ink text-paper font-tag text-xs font-semibold uppercase px-3 hover:bg-forest disabled:bg-muted disabled:border-muted"
                      >
                        Appliquer
                      </button>
                    </div>
                    {codeMessage && <p className="font-body text-xs text-rust mt-1">{codeMessage}</p>}
                  </form>
                )}
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
                  disabled={
                    submitting ||
                    compteEnCours ||
                    livraisonRefusee ||
                    authChargement ||
                    !prix.pret ||
                    indisponibles.length > 0 ||
                    lignesValides.length === 0
                  }
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

// Lignes « remise » et « frais » sous le sous-total (panier, confirmation).
function LignesRemises({ commande }) {
  const remiseCode = Number(commande.remise_code || 0)
  const remiseBon = Number(commande.remise_bon || 0)
  const frais = Number(commande.frais_livraison || 0)
  return (
    <>
      {remiseCode > 0 && (
        <div className="flex justify-between font-body text-sm text-forest mt-1">
          <span>
            Code {commande.code_promo}
            {commande.pourcentage ? ` (-${commande.pourcentage} %)` : ''}
          </span>
          <span>-{euros(remiseCode)}</span>
        </div>
      )}
      {remiseBon > 0 && (
        <div className="flex justify-between font-body text-sm text-forest mt-1">
          <span>{MOTIFS_BON[commande.motif_bon] || "Bon d'achat"}</span>
          <span>-{euros(remiseBon)}</span>
        </div>
      )}
      {frais > 0 && (
        <div className="flex justify-between font-body text-sm text-ink mt-1">
          <span>Frais de livraison</span>
          <span>{euros(frais)}</span>
        </div>
      )}
    </>
  )
}
