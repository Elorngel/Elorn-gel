import { useProducts } from '../hooks/useProducts'
import { usePriceMode } from '../context/PriceModeContext'
import CroppableImage from './CroppableImage'
import BandeauRetrait from './BandeauRetrait'
import { urlProduit } from '../lib/adresses'
import { contenuBlack, ligneTicket } from '../lib/blackFriday'

// Bannière « Black Friday » façon ticket de caisse (maquette 2 choisie le 13/11/2026). Remplace la bannière de
// l'accueil quand l'admin coche le mode Black Friday. `apercu` (admin) : montre aussi les produits sans promo en cours,
// signalés en rouge, pour pouvoir préparer le ticket avant la semaine.

const prix = (n) => `${n.toFixed(2)} €`
// Bas du ticket en dents de scie (bord déchiré).
const DECHIRURE = {
  WebkitMask:
    'linear-gradient(#000,#000) top/100% calc(100% - 12px) no-repeat, radial-gradient(circle at 8px 12px, transparent 7px, #000 7.5px) bottom/16px 12px repeat-x',
  mask: 'linear-gradient(#000,#000) top/100% calc(100% - 12px) no-repeat, radial-gradient(circle at 8px 12px, transparent 7px, #000 7.5px) bottom/16px 12px repeat-x',
}
const CODE_BARRES =
  'repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 4px,#111 4px 5px,transparent 5px 9px,#111 9px 12px,transparent 12px 13px)'

export default function HeroBlack({ contenu: brut, apercu = false }) {
  const c = contenuBlack(brut)
  const { products } = useProducts({ leger: true })
  const { isPickup, getPickupPrice } = usePriceMode()

  const lignes = c.produits
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => p && (apercu || p.actif !== false))
    .map((p) => ligneTicket(p, isPickup, getPickupPrice))
    .filter((l) => l && (apercu || (l.remise > 0 && !l.produit.en_rupture)))
  const maxRemise = Math.max(0, ...lignes.map((l) => l.remise))
  const photos = lignes.filter((l) => l.produit.photo_url).slice(0, 4)
  const aujourdhui = new Date().toLocaleDateString('fr-FR')

  return (
    <>
      <section className="bg-[#111] text-paper border-b border-ink/15 overflow-hidden">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 px-5 sm:px-10 lg:px-14 pt-10 lg:pt-11 pb-10 lg:pb-0 lg:min-h-[520px]">
          <div className="lg:pt-2.5">
            {c.sur && <p className="font-tag font-bold text-xs uppercase tracking-[5px] text-rust">{c.sur}</p>}
            <h1 className="font-display font-normal text-[84px] sm:text-[120px] leading-[0.85] my-3.5">
              {c.titre1}
              <span className="block text-transparent" style={{ WebkitTextStroke: '2px #fbfaf6' }}>
                {c.titre2}
              </span>
            </h1>
            {c.texte && <p className="font-body text-base leading-relaxed text-[#c9c4b4] max-w-[480px]">{c.texte}</p>}
            {c.bouton && (
              <a
                href={c.lien || '/promotions'}
                className="inline-block mt-6 bg-paper text-[#111] font-tag font-bold text-sm uppercase tracking-wide px-6 py-3.5 hover:bg-stone transition-colors"
              >
                {c.bouton} →
              </a>
            )}
            {photos.length > 0 && (
              <div className="flex gap-2.5 mt-7">
                {photos.map((l) => (
                  <a
                    key={l.produit.id}
                    href={urlProduit(l.produit)}
                    className="relative block w-[22%] max-w-[104px] aspect-square overflow-hidden bg-stone"
                    title={l.produit.nom}
                  >
                    <CroppableImage
                      src={l.produit.photo_url}
                      alt={l.produit.nom}
                      loading="eager"
                      zoom={l.produit.photo_zoom ?? 1}
                      posX={l.produit.photo_pos_x ?? 50}
                      posY={l.produit.photo_pos_y ?? 50}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {lignes.length > 0 && (
            <div
              className="self-start bg-[#f7f5ee] text-[#111] font-tag px-5 sm:px-7 pt-7 pb-10 lg:rotate-[1.5deg] shadow-[0_20px_40px_rgba(0,0,0,.4)]"
              style={DECHIRURE}
            >
              <div className="text-center border-b border-dashed border-[#111] pb-3 mb-3">
                <b className="block font-display font-normal text-[34px] tracking-[2px] leading-none">BONTIN</b>
                <small className="text-[11px] uppercase tracking-wide">Ticket Black Week · {aujourdhui}</small>
              </div>
              {lignes.map((l) => (
                <a
                  key={l.produit.id}
                  href={urlProduit(l.produit)}
                  className="flex items-baseline gap-1.5 text-[13px] uppercase my-2 hover:text-rust"
                >
                  <span className="min-w-0">
                    {l.produit.nom}
                    {apercu && l.remise === 0 && (
                      <em className="not-italic text-rust normal-case"> (pas en promo : caché aux clients)</em>
                    )}
                  </span>
                  <i className="flex-1 border-b border-dotted border-[#888] min-w-3" />
                  {l.remise > 0 && <s className="text-[#888] text-xs shrink-0">{prix(l.avant)}</s>}
                  <b className="text-rust font-bold w-[66px] text-right shrink-0">{prix(l.apres)}</b>
                </a>
              ))}
              {maxRemise > 0 && (
                <div className="border-t border-dashed border-[#111] mt-3.5 pt-3 flex justify-between font-display text-[26px] sm:text-[30px] leading-none">
                  <span>Vous économisez</span>
                  <b className="font-normal text-rust">jusqu'à {Math.round(maxRemise)} %</b>
                </div>
              )}
              <div className="mt-3.5 h-[46px]" style={{ background: CODE_BARRES }} />
              <p className="text-center text-[11px] tracking-[3px] uppercase mt-2">Merci de votre visite</p>
            </div>
          )}
        </div>
      </section>
      {!apercu && <BandeauRetrait />}
    </>
  )
}
