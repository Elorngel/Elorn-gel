import { useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useProducts } from '../hooks/useProducts'
import HeroBlack from './HeroBlack'
import { PriceModeProvider, usePriceMode } from '../context/PriceModeContext'
import { BLACK_DEFAUT, contenuBlack } from '../lib/blackFriday'
import { getDiscountPercent, getPromoStatus } from '../lib/pricing'
import { correspond } from '../lib/texte'
import { urlPhoto, photoDeSecours } from '../lib/photos'

// Onglet « Black Friday » de l'admin (13/11/2026) : bannière « ticket de caisse » de la page d'accueil.
// Interrupteur (parametres_site.black_actif) ; textes et produits du ticket dans parametres_site.black.
const champ = 'w-full border border-ink/20 p-1.5 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const etiquette = 'block font-tag text-[10px] uppercase text-muted mb-1'
const bouton =
  'bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-3 py-2 hover:bg-forest disabled:bg-muted'
const dateFr = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR') : '')

// L'admin n'est pas dans le PriceModeProvider du site : l'aperçu a le sien, avec un choix Retrait / Livraison.
function ChoixModeApercu() {
  const { mode, setMode } = usePriceMode()
  return (
    <div className="flex border border-ink w-fit mb-3">
      {[
        ['retrait', 'Prix retrait'],
        ['livraison', 'Prix livraison'],
      ].map(([m, libelle]) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`px-3 py-1.5 font-tag text-xs uppercase font-semibold ${mode === m ? 'bg-ink text-paper' : 'text-ink'}`}
        >
          {libelle}
        </button>
      ))}
    </div>
  )
}

function Cadre({ titre, children }) {
  return (
    <section className="bg-paper border border-ink/15 p-4 mb-5">
      <h2 className="font-display text-2xl text-ink mb-3">{titre}</h2>
      {children}
    </section>
  )
}

function Interrupteur({ settings, updateSettings, modifie }) {
  const [enCours, setEnCours] = useState(false)
  const actif = !!settings?.black_actif
  const basculer = async () => {
    if (!actif && modifie) {
      alert("Enregistrez d'abord vos modifications (bouton « Enregistrer » en bas), puis cochez la case.")
      return
    }
    if (
      !confirm(
        actif
          ? "Retirer la bannière Black Friday de la page d'accueil ?"
          : "Afficher la bannière Black Friday sur la page d'accueil du site (à la place de la bannière habituelle) ?"
      )
    )
      return
    setEnCours(true)
    try {
      await updateSettings({ black_actif: !actif })
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setEnCours(false)
    }
  }
  return (
    <div className={`border p-4 mb-5 ${actif ? 'bg-forest/10 border-forest' : 'bg-paper border-ink/15'}`}>
      <label className="flex items-center gap-3 cursor-pointer flex-wrap">
        <input type="checkbox" checked={actif} disabled={enCours} onChange={basculer} className="w-5 h-5 accent-forest" />
        <span className="font-tag text-sm uppercase font-semibold text-ink">
          Afficher la bannière Black Friday sur la page d'accueil
        </span>
        <span
          className={`ml-auto font-tag text-xs uppercase font-semibold px-2 py-1 ${
            actif ? 'bg-forest text-paper' : 'bg-stone text-muted'
          }`}
        >
          {actif ? 'Visible sur le site' : 'Caché aux clients'}
        </span>
      </label>
      <p className="font-body text-xs text-muted mt-2">
        Cochée : la bannière « ticket de caisse » remplace celle de l'accueil (même si le mode fêtes est coché) et un lien
        « {settings?.black?.menu || BLACK_DEFAUT.menu} » apparaît en tête du menu. Pensez à la décocher à la fin de la
        semaine.
      </p>
    </div>
  )
}

function ProduitsTicket({ ids, catalogue, onChange }) {
  const [recherche, setRecherche] = useState('')
  const deplacer = (i, sens) => {
    const j = i + sens
    if (j < 0 || j >= ids.length) return
    const copie = [...ids]
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
    onChange(copie)
  }
  const suggestions =
    recherche.trim().length >= 2
      ? catalogue.filter((p) => !ids.includes(p.id) && correspond(p.nom, recherche.trim())).slice(0, 8)
      : []

  return (
    <Cadre titre="Produits du ticket">
      <p className="font-body text-xs text-muted mb-3">
        Les prix du ticket sont ceux des <strong>promotions des fiches produits</strong> (onglet Produits : prix promo ou
        taux, avec dates de début et de fin du 23 au 29 novembre par exemple). Un produit sans promo en cours, en rupture
        ou masqué n'apparaît pas sur le ticket des clients. 6 à 8 lignes, c'est l'idéal. Les 4 premiers produits avec
        photo apparaissent aussi en vignettes sous le texte.
      </p>
      <div className="relative max-w-md mb-4">
        <span className={etiquette}>Ajouter un produit</span>
        <input className={champ} value={recherche} placeholder="Tapez le nom d'un produit…" onChange={(e) => setRecherche(e.target.value)} />
        {suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 bg-paper border border-ink/30 shadow-lg">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange([...ids, p.id])
                  setRecherche('')
                }}
                className="w-full text-left px-3 py-2 font-body text-sm hover:bg-stone"
              >
                {p.nom}
                {p.actif === false && <span className="text-rust text-xs"> (masqué)</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {ids.length === 0 && <p className="font-body text-sm text-muted">Aucun produit pour l'instant.</p>}
      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {ids.map((id, i) => {
          const p = catalogue.find((x) => x.id === id)
          const statut = p ? getPromoStatus(p) : null
          const remise = p ? getDiscountPercent(p) : 0
          return (
            <div key={id} className="py-2.5 flex items-center gap-3 flex-wrap">
              <div className="flex flex-col">
                <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} className="text-xs leading-none px-1 disabled:opacity-20" aria-label="Monter">
                  ▲
                </button>
                <button type="button" onClick={() => deplacer(i, 1)} disabled={i === ids.length - 1} className="text-xs leading-none px-1 disabled:opacity-20" aria-label="Descendre">
                  ▼
                </button>
              </div>
              <div className="relative w-12 h-12 bg-stone overflow-hidden shrink-0">
                {p?.photo_url && (
                  <img src={urlPhoto(p.photo_url)} onError={(e) => photoDeSecours(e.currentTarget, p.photo_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="font-body text-sm text-ink">{p ? p.nom : 'Produit introuvable (supprimé ?)'}</p>
                {p && (
                  <p className={`font-body text-xs ${remise > 0 ? 'text-forest' : 'text-rust'}`}>
                    {remise > 0
                      ? `En promo : -${Math.round(remise)} %${p.promo_fin ? ` jusqu'au ${dateFr(p.promo_fin)}` : ''}`
                      : statut === 'scheduled'
                        ? `Promo programmée à partir du ${dateFr(p.promo_debut)} : apparaîtra ce jour-là`
                        : 'Pas de promo en cours : caché aux clients'}
                    {p.actif === false && ' · produit masqué'}
                    {p.en_rupture && ' · en rupture'}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} className="font-tag text-xs uppercase font-semibold text-rust hover:underline">
                Retirer
              </button>
            </div>
          )
        })}
      </div>
    </Cadre>
  )
}

export default function BlackPanel() {
  const { settings, updateSettings } = useSiteSettings()
  const { products } = useProducts({ leger: true })
  const [modifs, setModifs] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState('')

  if (!settings) return <p className="font-body text-sm text-muted">Chargement…</p>

  const brouillon = modifs ?? contenuBlack(settings.black)
  const modifie = modifs !== null
  const changer = (changes) => {
    setModifs({ ...brouillon, ...changes })
    setMessage('')
  }
  const enregistrer = async () => {
    setEnCours(true)
    setMessage('')
    try {
      await updateSettings({ black: brouillon })
      setModifs(null)
      setMessage('Enregistré.')
    } catch (err) {
      setMessage(`Erreur : ${err.message}`)
    } finally {
      setEnCours(false)
    }
  }
  const texte = (cle, libelle, props = {}) => (
    <label className={props.large ? 'sm:col-span-2' : ''}>
      <span className={etiquette}>{libelle}</span>
      {props.large ? (
        <textarea rows={2} className={champ} value={brouillon[cle] || ''} onChange={(e) => changer({ [cle]: e.target.value })} />
      ) : (
        <input className={champ} value={brouillon[cle] || ''} placeholder={props.placeholder} onChange={(e) => changer({ [cle]: e.target.value })} />
      )}
      {props.aide && <span className="block font-body text-[11px] text-muted mt-1">{props.aide}</span>}
    </label>
  )

  return (
    <div>
      <Interrupteur settings={settings} updateSettings={updateSettings} modifie={modifie} />

      <Cadre titre="Textes de la bannière">
        <div className="grid gap-3 sm:grid-cols-2">
          {texte('sur', 'Petite ligne au-dessus du titre')}
          {texte('menu', 'Lien en tête du menu', { aide: 'Ex. : Black Week' })}
          {texte('titre1', 'Titre, 1re ligne (pleine)')}
          {texte('titre2', 'Titre, 2e ligne (contour)')}
          {texte('texte', 'Texte', { large: true })}
          {texte('bouton', 'Texte du bouton')}
          {texte('lien', 'Page ouverte par le bouton et le lien du menu', {
            placeholder: '/promotions',
            aide: '/promotions = toutes les promos en cours (conseillé).',
          })}
        </div>
      </Cadre>

      <ProduitsTicket ids={brouillon.produits} catalogue={products} onChange={(produits) => changer({ produits })} />

      <div className="sticky bottom-0 z-20 bg-stone/95 border-t border-ink/15 py-3 mb-5 flex items-center gap-3 flex-wrap">
        <button type="button" onClick={enregistrer} disabled={enCours || !modifie} className={bouton}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {modifie && (
          <button type="button" onClick={() => setModifs(null)} className="font-tag text-xs uppercase font-semibold text-muted hover:underline">
            Annuler les modifications
          </button>
        )}
        <button
          type="button"
          onClick={() => confirm('Remettre les textes et produits proposés au départ ? (Pensez ensuite à « Enregistrer ».)') && changer(contenuBlack(BLACK_DEFAUT))}
          className="font-tag text-xs uppercase font-semibold text-muted hover:underline"
        >
          Revenir aux textes de départ
        </button>
        {message && <span className="font-body text-sm text-forest">{message}</span>}
        {modifie && !message && <span className="font-body text-xs text-rust">Modifications non enregistrées</span>}
      </div>

      <Cadre titre="Aperçu">
        <p className="font-body text-xs text-muted mb-3">
          Ce que verront les clients en haut de la page d'accueil, avec les prix retrait ou livraison (boutons ci-dessous). Les lignes signalées en rouge n'ont pas de promo en cours et ne seront pas montrées aux clients.
        </p>
        <PriceModeProvider>
          <ChoixModeApercu />
          <HeroBlack contenu={brouillon} apercu />
        </PriceModeProvider>
      </Cadre>
    </div>
  )
}
