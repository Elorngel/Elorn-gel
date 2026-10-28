import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import PastillesParrainage from '../components/PastillesParrainage'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useAuth } from '../context/AuthContext'
import { eurosTexte as euros, lienParrainage, retenirCodeParrain } from '../lib/offres'
import { useSeo } from '../lib/seo'

// Page « Parrainage » (#parrainage). Arrivé par un lien #parrainage/CODE, le visiteur voit le code
// de son parrain, retenu pour la création de son compte (voir App.jsx).
export default function ParrainagePage({ codeRecu }) {
  useSeo({
    titre: 'Parrainage',
    description: 'Parrainez vos proches chez Bontin : un bon d’achat pour vous et pour votre filleul sur vos commandes de surgelés.',
    chemin: '/parrainage',
  })
  const { settings } = useSiteSettings()
  const { client } = useAuth()
  const [copie, setCopie] = useState(false)

  // Code reçu par un lien de parrainage : retenu pour la création du compte.
  useEffect(() => {
    if (codeRecu) retenirCodeParrain(codeRecu)
  }, [codeRecu])
  const montant = settings?.parrainage_montant ?? 25
  const minimum = settings?.parrainage_minimum ?? 50
  const mois = settings?.parrainage_validite_mois ?? 1
  const validite = `${mois} mois`
  const actif = settings?.parrainage_actif !== false

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lienParrainage(client.code_parrain))
      setCopie(true)
    } catch {
      setCopie(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone">
      <Header activeCategory={null} />
      <main className="max-w-3xl mx-auto px-5 py-8">
        <h1 className="font-display text-4xl text-ink mb-2">Parrainage</h1>
        <p className="font-body text-base text-ink mb-6">
          Faites découvrir Bontin à vos proches : vous gagnez tous les deux {euros(montant)}.
        </p>

        {!actif && (
          <p className="border border-rust bg-rust/5 p-3 font-body text-sm mb-6">
            Le parrainage est suspendu pour le moment.
          </p>
        )}

        <div className="bg-ink text-paper py-8 px-4 mb-6">
          <PastillesParrainage montant={montant} />
        </div>

        {codeRecu && !client && (
          <div className="border-2 border-forest bg-paper p-4 mb-6">
            <p className="font-body text-sm">
              Vous avez été parrainé avec le code <strong className="font-tag text-base">{codeRecu}</strong>. Il
              est déjà retenu : créez votre compte au moment de commander, et vos {euros(montant)} seront
              déduits de votre première commande dès {euros(minimum)} d'achats.
            </p>
            <a
              href="/catalogue"
              className="inline-block mt-3 bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-forest"
            >
              Voir le catalogue
            </a>
          </div>
        )}

        {client?.code_parrain && (
          <div className="bg-paper border border-ink/15 p-4 mb-6">
            <p className="font-tag text-[11px] uppercase text-muted mb-1">Votre code parrain</p>
            <p className="font-display text-4xl text-forest leading-none">{client.code_parrain}</p>
            <p className="font-body text-sm mt-2 break-all text-muted">{lienParrainage(client.code_parrain)}</p>
            <button
              type="button"
              onClick={copier}
              className="mt-3 bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-forest"
            >
              {copie ? 'Lien copié !' : 'Copier mon lien de parrainage'}
            </button>
          </div>
        )}

        <section className="bg-paper border border-ink/15 p-4 mb-6">
          <h2 className="font-display text-2xl text-ink mb-3">Comment ça marche ?</h2>
          <ol className="font-body text-sm text-ink flex flex-col gap-3 list-decimal pl-5">
            <li>
              {client ? 'Partagez votre code ou votre lien (ci-dessus, et dans « Mon compte »).' : (
                <>
                  Créez votre compte Bontin : votre code parrain apparaît dans{' '}
                  <a href="/mon-compte" className="underline">
                    « Mon compte »
                  </a>
                  .
                </>
              )}
            </li>
            <li>
              Votre filleul saisit votre code en créant son compte (ou clique simplement sur votre lien) :{' '}
              <strong>{euros(montant)} sont déduits de sa première commande</strong>, dès {euros(minimum)}{' '}
              d'achats.
            </li>
            <li>
              Dès que sa commande est livrée ou retirée, <strong>vous recevez à votre tour {euros(montant)}</strong>{' '}
              sur votre prochaine commande. Ils s'appliquent tout seuls dans votre panier.
            </li>
          </ol>
        </section>

        <section className="font-body text-xs text-muted leading-relaxed">
          <h2 className="font-tag text-[11px] uppercase font-semibold text-ink mb-1">Conditions</h2>
          <p>
            Le filleul doit être un nouveau client Bontin, d'un foyer différent de celui du parrain (adresse et
            téléphone différents). Chaque bon de {euros(montant)} est valable {validite} à partir de sa création, pour
            une commande d'au moins {euros(minimum)} de produits (hors frais de livraison), en une seule fois ; il
            n'est ni remboursable ni échangeable contre de l'argent, et un seul bon est utilisé par commande. Le bon
            du parrain est créé quand la première commande d'au moins {euros(minimum)} de son filleul est livrée ou
            retirée. Le nombre de filleuls n'est pas limité. Les bons sont cumulables avec les promotions, la remise
            retrait et les codes promo. Bontin se réserve le droit d'annuler un parrainage abusif ou frauduleux.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
