import SocialIcon from '../components/SocialIcon'
import { DEFAULT_EMAIL, DEFAULT_TELEPHONE, DEFAULT_ADRESSE } from '../lib/siteDefaults'

export const MESSAGE_MAINTENANCE_DEFAUT =
  'Notre site est en cours de mise à jour. Vous pouvez toujours nous appeler pour passer commande.'

// Page affichée aux visiteurs quand l'admin a coché « Site en maintenance ».
export default function MaintenancePage({ settings }) {
  const telephone = settings?.contact_telephone || DEFAULT_TELEPHONE
  const email = settings?.contact_email || DEFAULT_EMAIL
  const adresse = settings?.adresse || DEFAULT_ADRESSE
  const message = settings?.message_maintenance?.trim() || MESSAGE_MAINTENANCE_DEFAUT

  return (
    <div className="min-h-screen bg-stone flex flex-col">
      <div className="h-2 bg-forest" />
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-xl bg-paper border border-ink/15">
          <div className="border-b border-ink/15 px-6 py-5 flex items-center justify-between gap-4">
            <img src={settings?.logo_url || '/logo.png'} alt="Bontin" className="h-10 w-auto" />
            <span className="font-tag text-[11px] uppercase font-semibold tracking-wide bg-rust text-paper px-2 py-1">
              Fermé pour travaux
            </span>
          </div>

          <div className="px-6 py-8">
            <h1 className="font-display text-5xl sm:text-6xl leading-none text-forest">On revient très vite</h1>
            <p className="font-body text-base text-ink mt-4 whitespace-pre-line">{message}</p>

            <a
              href={`tel:${telephone.replace(/\s/g, '')}`}
              className="mt-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3 border-2 border-ink px-4 py-3 hover:bg-ink hover:text-paper transition-colors"
            >
              <span className="font-tag text-xs uppercase font-semibold">Commander par téléphone</span>
              <span className="font-display text-3xl leading-none whitespace-nowrap">{telephone}</span>
            </a>

            <ul className="mt-6 flex flex-col gap-1 font-body text-sm text-muted">
              <li>
                <a href={`mailto:${email}`} className="hover:underline">
                  {email}
                </a>
              </li>
              <li>{adresse}</li>
            </ul>

            {(settings?.lien_facebook || settings?.lien_instagram) && (
              <div className="mt-5 flex items-center gap-5 font-body text-sm">
                <SocialIcon name="Facebook" url={settings?.lien_facebook} label hideIfEmpty className="text-ink! hover:text-forest!" />
                <SocialIcon name="Instagram" url={settings?.lien_instagram} label hideIfEmpty className="text-ink! hover:text-forest!" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
