import { useState } from 'react'
import { etatAffichage } from '../lib/periode'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useProducts } from '../hooks/useProducts'
import HeroFetes from './HeroFetes'
import { FETES_DEFAUT, MAX_COUVERTURE, contenuFetes, rayonFetes, urlFetes, libelleSousRayon, trierFetes } from '../lib/fetes'
import { estDansRayon } from '../lib/rayons'
import { useCategories } from '../hooks/useCategories'
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
  const enregistre = contenuFetes(settings?.fetes)
  const etat = etatAffichage(actif, enregistre.debut, enregistre.fin)
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
            etat.visible ? 'bg-forest text-paper' : etat.programme ? 'bg-rust text-paper' : 'bg-stone text-muted'
          }`}
        >
          {etat.libelle}
        </span>
      </label>
      <p className="font-body text-xs text-muted mt-2">
        La bannière s'affiche quand la case est cochée ET que l'on est dans la période choisie plus bas (« Afficher du …
        au … ») : vous pouvez cocher à l'avance, elle apparaîtra et disparaîtra toute seule. Décoché : bannière
        habituelle. Les dates à retenir déjà passées et le décompte « J - … » disparaissent aussi tout seuls.
      </p>
    </div>
  )
}

// Contenu de la rubrique (16/11/2026) : c'est le rayon « Fêtes » de l'admin. On l'affiche ici pour information, avec
// le nombre de produits par sous-catégorie et des liens pour voir chaque page.
function ContenuRubrique({ categories, subcategoriesByCategory, produits, visible, onVisible, ordre, onOrdre }) {
  const [ouvert, setOuvert] = useState(null)
  const rayon = rayonFetes(categories)
  const publies = produits.filter((p) => p.actif !== false)
  const sousRayons = rayon ? subcategoriesByCategory[rayon] || [] : []
  const total = rayon ? publies.filter((p) => estDansRayon(p, rayon)).length : 0
  const sansSous = rayon ? publies.filter((p) => estDansRayon(p, rayon) && !sousRayons.some((sr) => estDansRayon(p, rayon, sr))).length : 0
  return (
    <Cadre titre="Contenu de la rubrique « Les fêtes »">
      {!rayon ? (
        <p className="font-body text-sm text-rust">
          Aucun rayon « Fêtes » dans l'onglet Catégories : créez-le pour remplir la rubrique.
        </p>
      ) : (
        <>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={visible} onChange={(e) => onVisible(e.target.checked)} className="w-5 h-5 accent-forest" />
            <span className="font-tag text-sm uppercase font-semibold text-ink">Afficher la rubrique « Les fêtes » en tête du menu</span>
            <span className={`ml-auto font-tag text-xs uppercase font-semibold px-2 py-1 ${visible ? 'bg-forest text-paper' : 'bg-stone text-muted'}`}>
              {visible ? 'Visible sur le site' : 'Cachée aux clients'}
            </span>
          </label>
          <p className="font-body text-xs text-muted mb-3">
            Indépendant de la bannière d'accueil et de ses dates (plus bas) : la rubrique reste visible tant que cette case est
            cochée (pensez à « Enregistrer » en bas). La rubrique affiche <strong>automatiquement tous les produits du rayon « {rayon} »</strong> : dans l'onglet
            Produits, « + autre rayon » → {rayon} › sous-catégorie (ou {rayon} en rayon principal). Les sous-catégories
            (et leur ordre) se règlent dans l'onglet <strong>Catégories</strong> ; un tiret au début du nom (« -Apéritif »)
            n'est pas affiché aux clients. Le rayon « {rayon} » n'apparaît pas comme un rayon ordinaire dans le menu : il
            devient le menu « Les fêtes », en tête.
          </p>
          <p className="font-body text-xs text-ink mb-2">
            <strong>Ordre des produits :</strong> cliquez sur une sous-catégorie pour voir ses produits dans l'ordre du site,
            puis déplacez-les avec les flèches (▲ ▼) ou « En 1er ». Pensez à « Enregistrer » en bas. Un produit ajouté plus
            tard se place à la fin, par ordre alphabétique.
          </p>
          <div className="max-w-3xl border-t border-ink/10">
            {[...sousRayons, ...(sansSous ? [''] : [])].map((sr) => {
              const liste = trierFetes(
                publies.filter((p) =>
                  sr ? estDansRayon(p, rayon, sr) : estDansRayon(p, rayon) && !sousRayons.some((x) => estDansRayon(p, rayon, x))
                ),
                ordre,
                sr
              )
              const n = liste.length
              const estOuvert = ouvert === sr
              const deplacer = (i, vers) => {
                const ids = liste.map((p) => p.id)
                const [id] = ids.splice(i, 1)
                ids.splice(vers, 0, id)
                onOrdre(sr, ids)
              }
              return (
                <div key={sr || '__sans__'} className="border-b border-ink/10">
                  <div className="flex items-center gap-2 py-1.5">
                    <button
                      type="button"
                      disabled={!n}
                      onClick={() => setOuvert(estOuvert ? null : sr)}
                      className={`flex-1 flex justify-between items-center text-left px-2 py-1 font-body text-sm ${n ? 'text-ink hover:bg-stone' : 'text-muted'}`}
                    >
                      <span>
                        <span className={`inline-block w-4 text-[10px] transition-transform ${estOuvert ? 'rotate-90' : ''}`}>{n ? '▶' : ''}</span>
                        {sr ? libelleSousRayon(sr) : 'Et aussi (sans sous-catégorie)'}
                      </span>
                      <span className="font-tag text-xs">{n ? `${n} produit${n > 1 ? 's' : ''}` : 'vide (non affichée)'}</span>
                    </button>
                    {n > 0 && (
                      <a href={sr ? urlFetes(sr) : '/fetes'} className="font-tag text-[10px] uppercase text-muted hover:text-ink underline">
                        Voir
                      </a>
                    )}
                  </div>
                  {estOuvert && (
                    <ol className="pb-3 pl-6 space-y-1">
                      {liste.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-2 bg-stone/50 border border-ink/10 pr-2">
                          <span className="w-6 text-center font-tag text-xs text-muted">{i + 1}</span>
                          <div className="relative w-12 h-12 bg-stone overflow-hidden shrink-0">
                            {p.photo_url && (
                              <img
                                src={urlPhoto(p.photo_url)}
                                onError={(e) => photoDeSecours(e.currentTarget, p.photo_url)}
                                alt=""
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span className="flex-1 font-body text-sm text-ink truncate">{p.nom}</span>
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => deplacer(i, 0)}
                            className="font-tag text-[10px] uppercase font-semibold text-forest hover:underline disabled:invisible"
                          >
                            En 1er
                          </button>
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => deplacer(i, i - 1)}
                            aria-label="Monter"
                            className="w-8 h-8 border border-ink/20 bg-paper text-ink hover:border-ink disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={i === n - 1}
                            onClick={() => deplacer(i, i + 1)}
                            aria-label="Descendre"
                            className="w-8 h-8 border border-ink/20 bg-paper text-ink hover:border-ink disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )
            })}
          </div>
          <p className="font-body text-xs text-muted mt-2">
            {total} produit{total > 1 ? 's' : ''} publié{total > 1 ? 's' : ''} dans la rubrique
            {sansSous ? `, dont ${sansSous} sans sous-catégorie (affichés en fin de page, « Et aussi »)` : ''}.{' '}
            <a href="/fetes" className="underline">Voir la page</a>
          </p>
        </>
      )}
    </Cadre>
  )
}

// Les 4 photos de la bannière d'accueil : produit, phrase dorée, nom affiché.
function PhotosBanniere({ produits, catalogue, onChange }) {
  const couvertures = produits.filter((p) => p.couverture).slice(0, MAX_COUVERTURE)
  const cases = Array.from({ length: MAX_COUVERTURE }, (_, i) => couvertures[i] || { id: '', couverture: true, phrase: '', nom: '' })
  const choix = catalogue.filter((p) => p.photo_url).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  const changerCase = (i, changes) =>
    onChange(cases.map((c, j) => (j === i ? { ...c, ...changes } : c)).filter((c) => c.id))
  return (
    <Cadre titre="Les 4 photos de la bannière d'accueil">
      <p className="font-body text-xs text-muted mb-3">
        Chaque photo mène à la fiche du produit, cadrée comme sur le site. Un produit masqué n'apparaît pas.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {cases.map((t, i) => {
          const produit = catalogue.find((p) => p.id === t.id)
          return (
            <div key={i} className="border border-ink/15 p-3 flex gap-3">
              <div className="relative w-16 h-16 bg-stone overflow-hidden shrink-0">
                {produit?.photo_url && (
                  <img
                    src={urlPhoto(produit.photo_url)}
                    onError={(e) => photoDeSecours(e.currentTarget, produit.photo_url)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="block">
                  <span className={etiquette}>Photo {i + 1} : produit</span>
                  <select className={champ} value={t.id || ''} onChange={(e) => changerCase(i, { id: e.target.value })}>
                    <option value="">— aucun —</option>
                    {choix.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                        {p.actif === false ? ' (masqué)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={etiquette}>Phrase dorée</span>
                  <input className={champ} value={t.phrase || ''} placeholder="Ex. : Pour trinquer" onChange={(e) => changerCase(i, { phrase: e.target.value })} />
                </label>
                <label className="block">
                  <span className={etiquette}>Nom affiché (vide = nom du produit)</span>
                  <input className={champ} value={t.nom || ''} placeholder={produit?.nom || ''} onChange={(e) => changerCase(i, { nom: e.target.value })} />
                </label>
              </div>
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
  const { categories, subcategoriesByCategory } = useCategories()
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
    // L'ordre des produits et la case de la rubrique ne sont pas touchés.
    changer({ ...contenuFetes(FETES_DEFAUT), ordre: brouillon.ordre, rubrique: brouillon.rubrique })
  }

  return (
    <div>
      <ContenuRubrique
        categories={categories}
        subcategoriesByCategory={subcategoriesByCategory}
        produits={products}
        visible={brouillon.rubrique !== false}
        onVisible={(v) => changer({ rubrique: v })}
        ordre={brouillon.ordre}
        onOrdre={(sr, ids) => changer({ ordre: { ...brouillon.ordre, [sr]: ids } })}
      />

      <Interrupteur settings={settings} updateSettings={updateSettings} modifie={modifie} />

      <Cadre titre="Période d'affichage">
        <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
          <label>
            <span className={etiquette}>Afficher à partir du</span>
            <input type="date" className={champ} value={brouillon.debut || ''} onChange={(e) => changer({ debut: e.target.value })} />
          </label>
          <label>
            <span className={etiquette}>Jusqu'au (inclus)</span>
            <input type="date" className={champ} value={brouillon.fin || ''} onChange={(e) => changer({ fin: e.target.value })} />
          </label>
        </div>
        <p className="font-body text-[11px] text-muted mt-1">Changement à minuit. Une date vide = pas de limite de ce côté.</p>
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={brouillon.etoiles !== false}
            onChange={(e) => changer({ etoiles: e.target.checked })}
            className="w-4 h-4 accent-forest"
          />
          <span className="font-body text-sm">
            Petites étoiles dorées sur tout le site pendant cette période (comme sur la bannière, jamais dans l'admin)
          </span>
        </label>
      </Cadre>

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

      <PhotosBanniere produits={brouillon.produits} catalogue={products} onChange={(produits) => changer({ produits })} />

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
