import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChampsCompte, { COMPTE_VIDE, nouveauCompte } from '../components/ChampsCompte'
import { useAuth } from '../context/AuthContext'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { supabase } from '../lib/supabaseClient'
import { printBonDeCommande } from '../lib/printOrder'
import { DEFAULT_TELEPHONE } from '../lib/siteDefaults'
import { MOTIFS_BON, euros, eurosTexte, lienParrainage } from '../lib/offres'

const STATUTS = { nouvelle: 'Reçue', preparee: 'Préparée', livree: 'Livrée / retirée' }
const champ = 'w-full border border-ink/20 p-2 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const bouton =
  'bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-forest transition-colors disabled:bg-muted'

function Cadre({ titre, children }) {
  return (
    <section className="bg-paper border border-ink/15 p-4">
      <h2 className="font-display text-2xl text-ink mb-3">{titre}</h2>
      {children}
    </section>
  )
}

function NonConnecte() {
  const { connexion, creerCompte } = useAuth()
  const { settings } = useSiteSettings()
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [compte, setCompte] = useState(nouveauCompte)
  const [erreurCreation, setErreurCreation] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const seConnecter = async (e) => {
    e.preventDefault()
    setErreur('')
    setEnvoi(true)
    try {
      await connexion(email, mdp)
    } catch (err) {
      setErreur(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  const creer = async (e) => {
    e.preventDefault()
    setErreurCreation('')
    setEnvoi(true)
    try {
      await creerCompte(compte)
    } catch (err) {
      setErreurCreation(err.message)
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.3fr] items-start">
      <Cadre titre="Se connecter">
        <form onSubmit={seConnecter} className="flex flex-col gap-3">
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={champ}
          />
          <input
            required
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
            className={champ}
          />
          {erreur && <p className="font-body text-sm text-rust">{erreur}</p>}
          <button type="submit" disabled={envoi} className={bouton}>
            Se connecter
          </button>
          <p className="font-body text-xs text-muted">
            Mot de passe oublié ? Appelez-nous au {settings?.contact_telephone || DEFAULT_TELEPHONE}.
          </p>
        </form>
      </Cadre>

      <Cadre titre="Créer mon compte">
        <form onSubmit={creer} className="flex flex-col gap-3">
          <ChampsCompte valeurs={compte} onChange={(c, v) => setCompte((x) => ({ ...x, [c]: v }))} idPrefixe="inscription" />
          {erreurCreation && <p className="font-body text-sm text-rust">{erreurCreation}</p>}
          <button type="submit" disabled={envoi} className={bouton}>
            Créer mon compte
          </button>
        </form>
      </Cadre>
    </div>
  )
}

function MesCommandes({ userId }) {
  const [commandes, setCommandes] = useState(null)
  const [ouverte, setOuverte] = useState(null)

  useEffect(() => {
    supabase
      .from('commandes')
      .select('*, commande_lignes(*)')
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCommandes(data || []))
  }, [userId])

  if (commandes === null) return <p className="font-body text-sm text-muted">Chargement…</p>
  if (commandes.length === 0) {
    return (
      <p className="font-body text-sm text-muted">
        Aucune commande pour le moment.{' '}
        <a href="#catalogue" className="underline">
          Voir le catalogue
        </a>
      </p>
    )
  }

  return (
    <ul className="divide-y divide-ink/10 border-y border-ink/10">
      {commandes.map((c) => {
        const date = new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOuverte(ouverte === c.id ? null : c.id)}
              className="w-full flex flex-wrap items-baseline justify-between gap-2 py-3 text-left hover:bg-stone/50"
            >
              <span className="font-body text-sm">
                <strong>{date}</strong> · {c.mode === 'retrait' ? 'Retrait au dépôt' : 'Livraison'}
                <span className="block font-tag text-xs text-muted">
                  {c.creneau_retrait || c.creneau_livraison}
                </span>
              </span>
              <span className="flex items-baseline gap-3">
                <span className="font-tag text-[11px] uppercase text-forest">{STATUTS[c.statut] || c.statut}</span>
                <span className="font-display text-xl">{Number(c.total).toFixed(2)} €</span>
                <span className="font-tag text-xs text-muted">{ouverte === c.id ? '▲' : '▼'}</span>
              </span>
            </button>
            {ouverte === c.id && (
              <div className="pb-3">
                <table className="w-full text-sm mb-2">
                  <tbody>
                    {c.commande_lignes.map((l) => (
                      <tr key={l.id} className="border-b border-ink/10">
                        <td className="py-1 font-body">{l.nom_produit}</td>
                        <td className="py-1 text-right font-tag">× {l.quantite}</td>
                        <td className="py-1 text-right font-tag">{(l.prix_unitaire * l.quantite).toFixed(2)} €</td>
                      </tr>
                    ))}
                    {c.remise_code > 0 && (
                      <tr>
                        <td className="py-1 font-body text-forest">Code {c.code_promo}</td>
                        <td />
                        <td className="py-1 text-right font-tag text-forest">-{euros(c.remise_code)}</td>
                      </tr>
                    )}
                    {c.remise_bon > 0 && (
                      <tr>
                        <td className="py-1 font-body text-forest">Bon d'achat</td>
                        <td />
                        <td className="py-1 text-right font-tag text-forest">-{euros(c.remise_bon)}</td>
                      </tr>
                    )}
                    {c.frais_livraison > 0 && (
                      <tr>
                        <td className="py-1 font-body text-muted">Frais de livraison</td>
                        <td />
                        <td className="py-1 text-right font-tag">{Number(c.frais_livraison).toFixed(2)} €</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => printBonDeCommande(c, c.commande_lignes)}
                  className="font-tag text-xs uppercase underline text-muted hover:text-ink"
                >
                  Imprimer le bon de commande
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function Parrainage({ client }) {
  const { settings } = useSiteSettings()
  const [bons, setBons] = useState(null)
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    supabase
      .from('bons_achat')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBons(data || []))
  }, [client.id])

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lienParrainage(client.code_parrain))
      setCopie(true)
    } catch {
      setCopie(false)
    }
  }

  const maintenant = new Date().toISOString()
  const etat = (b) =>
    b.commande_id ? 'Utilisé' : b.valable_jusqu_au < maintenant ? 'Expiré' : `Valable jusqu'au ${new Date(b.valable_jusqu_au).toLocaleDateString('fr-FR')}`

  return (
    <div className="flex flex-col gap-4">
      {settings?.parrainage_actif !== false && client.code_parrain && (
        <div>
          <p className="font-body text-sm mb-2">
            Parrainez vos proches : ils ont {eurosTexte(settings?.parrainage_montant ?? 25)} sur leur première commande, et
            vous aussi dès que leur commande est livrée.{' '}
            <a href="#parrainage" className="underline">
              Comment ça marche ?
            </a>
          </p>
          <p className="font-tag text-[11px] uppercase text-muted">Votre code parrain</p>
          <p className="font-display text-3xl text-forest leading-none">{client.code_parrain}</p>
          <button type="button" onClick={copier} className={`${bouton} mt-2`}>
            {copie ? 'Lien copié !' : 'Copier mon lien de parrainage'}
          </button>
        </div>
      )}
      <div>
        <p className="font-tag text-[11px] uppercase text-muted mb-1">Mes bons d'achat</p>
        {bons === null ? (
          <p className="font-body text-sm text-muted">Chargement…</p>
        ) : bons.length === 0 ? (
          <p className="font-body text-sm text-muted">Aucun bon pour le moment.</p>
        ) : (
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {bons.map((b) => (
              <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 font-body text-sm">
                <span>
                  <strong>{eurosTexte(b.montant)}</strong> · {MOTIFS_BON[b.motif] || "Bon d'achat"}
                  <span className="block font-tag text-[11px] text-muted">
                    Dès {eurosTexte(b.minimum_commande)} d'achats, appliqué automatiquement dans le panier
                  </span>
                </span>
                <span className={`font-tag text-[11px] uppercase ${b.commande_id || b.valable_jusqu_au < maintenant ? 'text-muted' : 'text-forest'}`}>
                  {etat(b)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MesInformations({ client, onEnregistre }) {
  const [valeurs, setValeurs] = useState(() => ({
    ...COMPTE_VIDE,
    prenom: client.prenom,
    nom: client.nom,
    telephone: client.telephone,
    dateNaissance: client.date_naissance,
    adresse: client.adresse,
    codePostal: client.code_postal,
    ville: client.ville,
    complement: client.complement || '',
    accepteOffres: client.accepte_offres,
  }))
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const enregistrer = async (e) => {
    e.preventDefault()
    setEnvoi(true)
    setMessage('')
    const { error } = await supabase
      .from('clients')
      .update({
        prenom: valeurs.prenom.trim(),
        nom: valeurs.nom.trim(),
        telephone: valeurs.telephone.trim(),
        date_naissance: valeurs.dateNaissance,
        adresse: valeurs.adresse.trim(),
        code_postal: valeurs.codePostal.trim(),
        ville: valeurs.ville.trim(),
        complement: valeurs.complement.trim() || null,
        accepte_offres: valeurs.accepteOffres,
      })
      .eq('id', client.id)
    setEnvoi(false)
    if (error) {
      setMessage("L'enregistrement n'a pas fonctionné, réessayez.")
      return
    }
    setMessage('Vos informations sont enregistrées.')
    onEnregistre()
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-3">
      <p className="font-body text-sm text-muted">
        Email : <strong className="text-ink">{client.email}</strong>
      </p>
      <ChampsCompte
        valeurs={valeurs}
        onChange={(c, v) => setValeurs((x) => ({ ...x, [c]: v }))}
        creation={false}
        idPrefixe="profil"
      />
      {message && <p className="font-body text-sm text-forest">{message}</p>}
      <button type="submit" disabled={envoi} className={`${bouton} self-start`}>
        {envoi ? 'Enregistrement…' : 'Enregistrer mes informations'}
      </button>
    </form>
  )
}

function SupprimerCompte() {
  const { deconnexion } = useAuth()
  const [etape, setEtape] = useState(0)
  const [erreur, setErreur] = useState('')

  const supprimer = async () => {
    setErreur('')
    const { error } = await supabase.rpc('supprimer_mon_compte')
    if (error) {
      setErreur('La suppression a échoué. Contactez-nous à contact@bontin.fr.')
      return
    }
    await deconnexion()
    window.location.hash = ''
  }

  if (etape === 0) {
    return (
      <button type="button" onClick={() => setEtape(1)} className="font-tag text-xs uppercase text-rust underline">
        Supprimer mon compte
      </button>
    )
  }
  return (
    <div className="border border-rust p-3">
      <p className="font-body text-sm mb-2">
        Votre compte et vos informations seront définitivement supprimés. Vos commandes passées restent
        conservées par Bontin pour la comptabilité, sans lien avec un compte.
      </p>
      {erreur && <p className="font-body text-sm text-rust mb-2">{erreur}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={supprimer} className="bg-rust text-paper font-tag text-xs uppercase font-semibold px-3 py-2">
          Oui, supprimer définitivement
        </button>
        <button type="button" onClick={() => setEtape(0)} className="font-tag text-xs uppercase underline">
          Annuler
        </button>
      </div>
    </div>
  )
}

export default function MonComptePage() {
  const { chargement, user, client, estAdmin, deconnexion, rechargerProfil } = useAuth()

  let contenu
  if (chargement) {
    contenu = <p className="font-body text-sm text-muted">Chargement…</p>
  } else if (!user) {
    contenu = <NonConnecte />
  } else if (!client) {
    contenu = (
      <Cadre titre={estAdmin ? 'Compte administrateur' : 'Mon compte'}>
        <p className="font-body text-sm mb-3">
          {estAdmin
            ? "Vous êtes connecté avec un compte d'administration."
            : 'Votre fiche client est introuvable. Contactez-nous.'}
        </p>
        <div className="flex gap-4">
          {estAdmin && (
            <a href="#admin" className={bouton}>
              Aller à l'administration
            </a>
          )}
          <button type="button" onClick={deconnexion} className="font-tag text-xs uppercase underline">
            Se déconnecter
          </button>
        </div>
      </Cadre>
    )
  } else {
    contenu = (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-body text-sm text-ink">Bonjour {client.prenom} !</p>
          <button type="button" onClick={deconnexion} className="font-tag text-xs uppercase underline text-muted hover:text-ink">
            Se déconnecter
          </button>
        </div>
        <Cadre titre="Mes commandes">
          <MesCommandes userId={user.id} />
        </Cadre>
        <Cadre titre="Parrainage et bons d'achat">
          <Parrainage client={client} />
        </Cadre>
        <Cadre titre="Mes informations">
          <MesInformations key={client.id} client={client} onEnregistre={rechargerProfil} />
        </Cadre>
        <SupprimerCompte />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone">
      <Header activeCategory={null} />
      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="font-display text-4xl text-ink mb-5">Mon compte</h1>
        {contenu}
      </main>
      <Footer />
    </div>
  )
}
