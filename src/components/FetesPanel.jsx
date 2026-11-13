import { useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useProducts } from '../hooks/useProducts'
import HeroFetes from './HeroFetes'
import { FETES_DEFAUT, MAX_COUVERTURE, contenuFetes } from '../lib/fetes'
import { correspond } from '../lib/texte'
import { urlPhoto, photoDeSecours } from '../lib/photos'

// Onglet « Fêtes » de l'admin (13/11/2026) : bannière « Le menu des fêtes » de la page d'accueil.
// Interrupteur en haut (parametres_site.fetes_actif) ; textes, 4 produits et dates enregistrés dans parametres_site.fetes.
const champ = 'w-full border border-ink/20 p-1.5 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const etiquette = 'block font-tag text-[10px] uppercase text-muted mb-1'
const bouton =
  'bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-3 py-2 hover:bg-forest disabled:bg-muted'

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
  const actif = !!settings?.fetes_actif
  const basculer = async () => {
    if (!actif && modifie) {
      alert("Enregistrez d'abord vos modifications (bouton « Enregistrer » en bas), puis cochez la case.")
      return
    }
    if (
      !confirm(
        actif
          ? "Retirer le menu des fêtes et remettre la bannière habituelle sur la page d'accueil ?"
          : "Afficher le menu des fêtes sur la page d'accueil du site (à la place de la bannière habituelle) ?"
      )
    )
      return
    setEnCours(true)
    try {
      await updateSettings({ fetes_actif: !actif })
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
          Afficher le menu des fêtes sur la page d'accueil
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
        Décoché : la page d'accueil garde sa bannière habituelle. Les dates déjà passées disparaissent toutes seules du
        site, et le décompte « J - … » aussi une fois le jour atteint.
      </p>
    </div>
  )
}

// Produits de la rubrique « Les fêtes » : ajout par recherche, ordre, et case « En couverture » (photos de la bannière).
function ProduitsFetes({ produits, catalogue, onChange }) {
  const [recherche, setRecherche] = useState('')
  const nbCouverture = produits.filter((p) => p.couverture).length
  const changerLigne = (i, changes) => onChange(produits.map((p, j) => (j === i ? { ...p, ...changes } : p)))
  const deplacer = (i, sens) => {
    const j = i + sens
    if (j < 0 || j >= produits.length) return
    const copie = [...produits]
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
    onChange(copie)
  }
  const ajouter = (p) => {
    onChange([...produits, { id: p.id, couverture: false, phrase: '', nom: '' }])
    setRecherche('')
  }
  const dejaLa = new Set(produits.map((p) => p.id))
  const suggestions =
    recherche.trim().length >= 2
      ? catalogue.filter((p) => !dejaLa.has(p.id) && correspond(p.nom, recherche.trim())).slice(0, 8)
      : []

  return (
    <Cadre titre="Produits du menu des fêtes">
      <p className="font-body text-xs text-muted mb-3">
        Tous ces produits apparaissent dans la rubrique « Les fêtes » du site (lien en tête du menu, et bouton de la
        bannière), dans cet ordre. Cochez <strong>« En couverture »</strong> pour les {MAX_COUVERTURE} photos de la
        bannière d'accueil ({nbCouverture}/{MAX_COUVERTURE} cochées).
      </p>

      <div className="relative max-w-md mb-4">
        <span className={etiquette}>Ajouter un produit</span>
        <input
          className={champ}
          value={recherche}
          placeholder="Tapez le nom d'un produit…"
          onChange={(e) => setRecherche(e.target.value)}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 bg-paper border border-ink/30 shadow-lg">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => ajouter(p)}
                className="w-full text-left px-3 py-2 font-body text-sm hover:bg-stone flex items-center gap-2"
              >
                {p.nom}
                {p.actif === false && <span className="text-rust text-xs">(masqué)</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {produits.length === 0 && <p className="font-body text-sm text-muted">Aucun produit pour l'instant.</p>}
      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {produits.map((t, i) => {
          const p = catalogue.find((x) => x.id === t.id)
          const bloquee = !t.couverture && nbCouverture >= MAX_COUVERTURE
          return (
            <div key={t.id} className={`py-2.5 ${t.couverture ? 'bg-forest/5' : ''}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-col">
                  <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0} className="text-xs leading-none px-1 disabled:opacity-20" aria-label="Monter">
                    ▲
                  </button>
                  <button type="button" onClick={() => deplacer(i, 1)} disabled={i === produits.length - 1} className="text-xs leading-none px-1 disabled:opacity-20" aria-label="Descendre">
                    ▼
                  </button>
                </div>
                <div className="relative w-12 h-12 bg-stone overflow-hidden shrink-0">
                  {p?.photo_url && (
                    <img
                      src={urlPhoto(p.photo_url)}
                      onError={(e) => photoDeSecours(e.currentTarget, p.photo_url)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="font-body text-sm text-ink">{p ? p.nom : 'Produit introuvable (supprimé ?)'}</p>
                  {p?.actif === false && <p className="font-body text-xs text-rust">Masqué sur le site : n'apparaît pas</p>}
                  {p && !p.photo_url && t.couverture && <p className="font-body text-xs text-rust">Pas de photo : pas affiché en couverture</p>}
                </div>
                <label className={`flex items-center gap-2 font-tag text-xs uppercase font-semibold ${bloquee ? 'text-muted' : 'text-forest cursor-pointer'}`}
                  title={bloquee ? `Déjà ${MAX_COUVERTURE} photos en couverture : décochez-en une d'abord` : ''}>
                  <input
                    type="checkbox"
                    checked={!!t.couverture}
                    disabled={bloquee}
                    onChange={(e) => changerLigne(i, { couverture: e.target.checked })}
                    className="w-4 h-4 accent-forest"
                  />
                  En couverture
                </label>
                <button
                  type="button"
                  onClick={() => onChange(produits.filter((_, j) => j !== i))}
                  className="font-tag text-xs uppercase font-semibold text-rust hover:underline"
                >
                  Retirer
                </button>
              </div>
              {t.couverture && (
                <div className="grid gap-2 sm:grid-cols-2 mt-2 sm:ml-[88px]">
                  <label>
                    <span className={etiquette}>Phrase dorée sur la photo</span>
                    <input className={champ} value={t.phrase || ''} placeholder="Ex. : Pour trinquer" onChange={(e) => changerLigne(i, { phrase: e.target.value })} />
                  </label>
                  <label>
                    <span className={etiquette}>Nom affiché (vide = nom du produit)</span>
                    <input className={champ} value={t.nom || ''} placeholder={p?.nom || ''} onChange={(e) => changerLigne(i, { nom: e.target.value })} />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Cadre>
  )
}

export default function FetesPanel() {
  const { settings, updateSettings } = useSiteSettings()
  const { products } = useProducts({ leger: true })
  // Modifications en cours (null = contenu enregistré).
  const [modifs, setModifs] = useState(null)
  const [modifie, setModifie] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState('')

  if (!settings) return <p className="font-body text-sm text-muted">Chargement…</p>

  const brouillon = modifs ?? contenuFetes(settings.fetes)
  const changer = (changes) => {
    setModifs({ ...brouillon, ...changes })
    setModifie(true)
    setMessage('')
  }
  const changerDate = (i, changes) => changer({ dates: brouillon.dates.map((d, j) => (j === i ? { ...d, ...changes } : d)) })

  const enregistrer = async () => {
    setEnCours(true)
    setMessage('')
    try {
      await updateSettings({ fetes: brouillon })
      setModifs(null)
      setModifie(false)
      setMessage('Enregistré.')
    } catch (err) {
      setMessage(`Erreur : ${err.message}`)
    } finally {
      setEnCours(false)
    }
  }
  const annuler = () => {
    setModifs(null)
    setModifie(false)
    setMessage('')
  }
  const parDefaut = () => {
    if (!confirm('Remettre tous les textes, produits et dates proposés au départ ? (Pensez ensuite à « Enregistrer ».)')) return
    changer(contenuFetes(FETES_DEFAUT))
  }

  return (
    <div>
      <Interrupteur settings={settings} updateSettings={updateSettings} modifie={modifie} />

      <Cadre titre="Textes de la bannière">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={etiquette}>Petite ligne au-dessus du titre</span>
            <input className={champ} value={brouillon.sur} onChange={(e) => changer({ sur: e.target.value })} />
          </label>
          <label>
            <span className={etiquette}>Titre</span>
            <input className={champ} value={brouillon.titre} onChange={(e) => changer({ titre: e.target.value })} />
          </label>
          <label className="sm:col-span-2">
            <span className={etiquette}>Texte</span>
            <textarea rows={2} className={champ} value={brouillon.texte} onChange={(e) => changer({ texte: e.target.value })} />
          </label>
          <label>
            <span className={etiquette}>Texte du bouton</span>
            <input className={champ} value={brouillon.bouton} onChange={(e) => changer({ bouton: e.target.value })} />
          </label>
          <label>
            <span className={etiquette}>Page ouverte par le bouton</span>
            <input
              className={champ}
              value={brouillon.lien}
              placeholder="/fetes"
              onChange={(e) => changer({ lien: e.target.value })}
            />
            <span className="block font-body text-[11px] text-muted mt-1">
              /fetes = la rubrique « Les fêtes » (conseillé). Autres ex. : /catalogue, /promotions, /rayon/desserts.
            </span>
          </label>
          <label>
            <span className={etiquette}>Décompte « J - … » jusqu'au</span>
            <input
              type="date"
              className={champ}
              value={brouillon.date_cible || ''}
              onChange={(e) => changer({ date_cible: e.target.value })}
            />
            <span className="block font-body text-[11px] text-muted mt-1">Laisser vide pour ne pas afficher de décompte.</span>
          </label>
        </div>
      </Cadre>

      <ProduitsFetes produits={brouillon.produits} catalogue={products} onChange={(produits) => changer({ produits })} />

      <Cadre titre="Les dates à retenir">
        <label className="block mb-3 max-w-sm">
          <span className={etiquette}>Titre de la rubrique</span>
          <input className={champ} value={brouillon.dates_titre} onChange={(e) => changer({ dates_titre: e.target.value })} />
        </label>
        <div className="space-y-2">
          {brouillon.dates.map((d, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[150px_200px_1fr_auto] items-end border-b border-ink/10 pb-2">
              <label>
                <span className={etiquette}>Date</span>
                <input type="date" className={champ} value={d.date || ''} onChange={(e) => changerDate(i, { date: e.target.value })} />
              </label>
              <label>
                <span className={etiquette}>Titre</span>
                <input className={champ} value={d.titre || ''} onChange={(e) => changerDate(i, { titre: e.target.value })} />
              </label>
              <label>
                <span className={etiquette}>Texte</span>
                <input className={champ} value={d.texte || ''} onChange={(e) => changerDate(i, { texte: e.target.value })} />
              </label>
              <button
                type="button"
                onClick={() => changer({ dates: brouillon.dates.filter((_, j) => j !== i) })}
                className="font-tag text-xs uppercase font-semibold text-rust hover:underline py-2"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => changer({ dates: [...brouillon.dates, { date: '', titre: '', texte: '' }] })}
          className="mt-3 font-tag text-xs uppercase font-semibold text-forest hover:underline"
        >
          + Ajouter une date
        </button>
        <p className="font-body text-[11px] text-muted mt-2">
          4 dates tiennent sur une ligne. Les dates passées disparaissent toutes seules du site ; sans date à venir, la
          rubrique n'apparaît pas.
        </p>
      </Cadre>

      <div className="sticky bottom-0 z-20 bg-stone/95 border-t border-ink/15 py-3 mb-5 flex items-center gap-3 flex-wrap">
        <button type="button" onClick={enregistrer} disabled={enCours || !modifie} className={bouton}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {modifie && (
          <button type="button" onClick={annuler} className="font-tag text-xs uppercase font-semibold text-muted hover:underline">
            Annuler les modifications
          </button>
        )}
        <button type="button" onClick={parDefaut} className="font-tag text-xs uppercase font-semibold text-muted hover:underline">
          Revenir aux textes de départ
        </button>
        {message && <span className="font-body text-sm text-forest">{message}</span>}
        {modifie && !message && <span className="font-body text-xs text-rust">Modifications non enregistrées</span>}
      </div>

      <Cadre titre="Aperçu">
        <p className="font-body text-xs text-muted mb-3">
          Ce que verront les clients en haut de la page d'accueil (aperçu de vos réglages, même non enregistrés). Sur
          téléphone, la carte passe au-dessus des photos.
        </p>
        <div className="bg-stone border border-ink/15 pb-6">
          <HeroFetes contenu={brouillon} apercu />
        </div>
      </Cadre>
    </div>
  )
}
