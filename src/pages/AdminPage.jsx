import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { useCategories } from '../hooks/useCategories'
import CroppableImage from '../components/CroppableImage'
import PhotoEditorModal from '../components/PhotoEditorModal'
import ProductDetailsModal from '../components/ProductDetailsModal'
import { adminLogout } from '../components/AdminGate'
import OrdersPanel from '../components/OrdersPanel'
import VariantsModal from '../components/VariantsModal'
import CategoriesPanel from '../components/CategoriesPanel'
import OccasionsPanel from '../components/OccasionsPanel'
import SuppliersPanel from '../components/SuppliersPanel'
import NewProductModal from '../components/NewProductModal'
import { getPricePerUnitLabel, getPromoStatus } from '../lib/pricing'

const NO_SPINNER =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

function EditableCell({ value, onSave, type = 'text', width = 'w-full', multiline = false }) {
  const [draft, setDraft] = useState(value ?? '')

  if (multiline) {
    return (
      <textarea
        rows={3}
        className={`${width} bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-xs py-1 resize-none leading-snug`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft)
        }}
      />
    )
  }

  return (
    <input
      type={type}
      className={`${width} bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-xs py-1 ${
        type === 'number' ? NO_SPINNER : ''
      }`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft)
      }}
    />
  )
}

const PROMO_STATUS_LABELS = {
  active: { text: 'Active', className: 'text-forest' },
  scheduled: { text: 'Programmée', className: 'text-muted' },
  expired: { text: 'Terminée', className: 'text-rust' },
}

function PromoEditor({ product, onSave }) {
  const [taux, setTaux] = useState(product.taux_promo > 0 ? product.taux_promo : '')
  const [prix, setPrix] = useState(product.prix_promo ?? '')
  const [debut, setDebut] = useState(product.promo_debut ?? '')
  const [fin, setFin] = useState(product.promo_fin ?? '')
  const status = PROMO_STATUS_LABELS[getPromoStatus(product)]
  const datesInversees = debut && fin && fin < debut

  const inputClass =
    'bg-transparent border-b border-ink/20 hover:border-ink/40 focus:border-forest focus:outline-none font-body text-xs py-1'

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => onSave({ en_promo: !product.en_promo })}
        className={`font-tag text-[10px] uppercase font-semibold px-1 py-1 w-full border ${
          product.en_promo ? 'border-rust bg-rust text-paper' : 'border-ink/40 text-ink'
        }`}
      >
        {product.en_promo ? 'En promo' : 'Promo'}
      </button>

      {product.en_promo && (
        <>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Taux"
              className={`${inputClass} w-12 ${NO_SPINNER}`}
              value={taux}
              onChange={(e) => setTaux(e.target.value)}
              onBlur={() => {
                const v = parseFloat(taux) || 0
                if (v !== (product.taux_promo || 0)) onSave({ taux_promo: v, prix_promo: null })
              }}
            />
            <span className="font-tag text-xs">%</span>
            <span className="font-tag text-[10px] text-muted ml-1">ou</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Prix"
              className={`${inputClass} w-14 ${NO_SPINNER}`}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              onBlur={() => {
                const v = parseFloat(prix)
                if (isNaN(v) || v <= 0) {
                  if (product.prix_promo != null) onSave({ prix_promo: null })
                } else if (v !== product.prix_promo) {
                  onSave({ prix_promo: v, taux_promo: 0 })
                }
              }}
            />
            <span className="font-tag text-xs">€</span>
          </div>

          <label className="flex items-center gap-1 font-tag text-[10px] uppercase text-muted">
            Du
            <input
              type="date"
              className={`${inputClass} flex-1 min-w-0`}
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              onBlur={() => {
                if (debut !== (product.promo_debut ?? '')) onSave({ promo_debut: debut || null })
              }}
            />
          </label>
          <label className="flex items-center gap-1 font-tag text-[10px] uppercase text-muted">
            Au
            <input
              type="date"
              className={`${inputClass} flex-1 min-w-0`}
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              onBlur={() => {
                if (fin !== (product.promo_fin ?? '')) onSave({ promo_fin: fin || null })
              }}
            />
          </label>

          {datesInversees ? (
            <p className="font-tag text-[10px] text-rust leading-tight">
              Fin avant début !
            </p>
          ) : (
            <p className={`font-tag text-[10px] leading-tight ${status ? status.className : 'text-rust'}`}>
              {status
                ? status.text
                : 'Indique un taux ou un prix.'}
            </p>
          )}
          {!debut && !fin && status && (
            <p className="font-tag text-[10px] text-muted leading-tight">
              Sans dates : toujours active.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function CategorySelect({ value, onSave, categories }) {
  return (
    <select
      className="w-full bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-xs py-1 cursor-pointer"
      value={value ?? ''}
      onChange={(e) => onSave(e.target.value)}
    >
      <option value="" disabled>
        — choisir —
      </option>
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  )
}

function SubcategorySelect({ categorie, value, onSave, subcategoriesByCategory }) {
  const options = subcategoriesByCategory[categorie] || []

  if (options.length === 0) {
    return <span className="font-tag text-xs text-muted">—</span>
  }

  return (
    <select
      className="w-full bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-xs py-1 cursor-pointer"
      value={value ?? ''}
      onChange={(e) => onSave(e.target.value)}
    >
      <option value="">— non classé —</option>
      {options.map((sub) => (
        <option key={sub} value={sub}>
          {sub}
        </option>
      ))}
    </select>
  )
}

function SiteSettingsPanel() {
  const { settings, loading, updateSettings, uploadSiteImage } = useSiteSettings()
  const [editing, setEditing] = useState(null) // 'hero' | 'logo' | null
  const [expanded, setExpanded] = useState(false)
  const [discountDraft, setDiscountDraft] = useState(null)
  const [deliveryFeeDraft, setDeliveryFeeDraft] = useState(null)
  const [badgeDraft, setBadgeDraft] = useState(null)
  const [titreDraft, setTitreDraft] = useState(null)
  const [sousTitreDraft, setSousTitreDraft] = useState(null)
  const [bandeauDraft, setBandeauDraft] = useState(null)
  const [emailDraft, setEmailDraft] = useState(null)
  const [telDraft, setTelDraft] = useState(null)
  const [adresseDraft, setAdresseDraft] = useState(null)

  useEffect(() => {
    if (settings && discountDraft === null) {
      setDiscountDraft(settings.remise_retrait ?? 10)
      setDeliveryFeeDraft(settings.frais_livraison ?? 7)
      setBadgeDraft(settings.hero_badge ?? '250 références')
      setTitreDraft(settings.hero_titre ?? 'Le surgelé, en livraison ou en retrait')
      setSousTitreDraft(
        settings.hero_sous_titre ??
          `Commandez chez vous, récupérez en point de retrait et économisez ${settings.remise_retrait ?? 10}% sur chaque commande retirée sur place.`
      )
      setBandeauDraft(settings.bandeau_haut ?? 'Retrait gratuit sous 24h à Plouédern')
      setEmailDraft(settings.contact_email ?? 'logistique@elorngel.fr')
      setTelDraft(settings.contact_telephone ?? '02 98 20 50 43')
      setAdresseDraft(settings.adresse ?? 'ZI de Keriel Nord, 29800 Plouédern')
    }
  }, [settings, discountDraft])

  if (loading || !settings) return null

  const saveDiscount = () => {
    const value = parseFloat(discountDraft)
    if (!isNaN(value) && value !== settings.remise_retrait) {
      updateSettings({ remise_retrait: value })
    }
  }

  const saveDeliveryFee = () => {
    const value = parseFloat(deliveryFeeDraft)
    if (!isNaN(value) && value !== settings.frais_livraison) {
      updateSettings({ frais_livraison: value })
    }
  }

  const saveBandeau = () => {
    if (bandeauDraft !== settings.bandeau_haut) updateSettings({ bandeau_haut: bandeauDraft })
  }
  const saveEmail = () => {
    if (emailDraft !== settings.contact_email) updateSettings({ contact_email: emailDraft })
  }
  const saveTel = () => {
    if (telDraft !== settings.contact_telephone) {
      updateSettings({ contact_telephone: telDraft })
    }
  }
  const saveAdresse = () => {
    if (adresseDraft !== settings.adresse) updateSettings({ adresse: adresseDraft })
  }

  const saveBadge = () => {
    if (badgeDraft !== settings.hero_badge) updateSettings({ hero_badge: badgeDraft })
  }
  const saveTitre = () => {
    if (titreDraft !== settings.hero_titre) updateSettings({ hero_titre: titreDraft })
  }
  const saveSousTitre = () => {
    if (sousTitreDraft !== settings.hero_sous_titre) {
      updateSettings({ hero_sous_titre: sousTitreDraft })
    }
  }

  return (
    <div className="bg-paper border border-ink/15 p-4 mb-6">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full text-left"
      >
        <h2 className="font-display text-xl text-ink">Réglages du site</h2>
        <span className={`text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="mt-3">
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => setEditing('hero')}
          className="flex items-center gap-3 border border-ink/20 p-2 hover:border-ink/40"
        >
          <span className="block w-20 h-14 bg-stone overflow-hidden relative">
            {settings.hero_url && (
              <CroppableImage
                src={settings.hero_url}
                zoom={settings.hero_zoom}
                posX={settings.hero_pos_x}
                posY={settings.hero_pos_y}
              />
            )}
          </span>
          <span className="font-tag text-xs uppercase">Photo vitrine</span>
        </button>

        <button
          onClick={() => setEditing('logo')}
          className="flex items-center gap-3 border border-ink/20 p-2 hover:border-ink/40"
        >
          <span className="block w-20 h-14 bg-stone overflow-hidden flex items-center justify-center">
            {settings.logo_url && (
              <img src={settings.logo_url} alt="" className="max-w-full max-h-full" />
            )}
          </span>
          <span className="font-tag text-xs uppercase">Logo</span>
        </button>

        <div className="flex items-center gap-3 border border-ink/20 p-2">
          <div>
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Remise retrait
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={discountDraft ?? ''}
                onChange={(e) => setDiscountDraft(e.target.value)}
                onBlur={saveDiscount}
                className="w-16 border border-ink/20 p-1.5 font-body text-sm text-center focus:border-forest focus:outline-none"
              />
              <span className="font-tag text-sm">%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-ink/20 p-2">
          <div>
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Frais de livraison
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                step="0.5"
                value={deliveryFeeDraft ?? ''}
                onChange={(e) => setDeliveryFeeDraft(e.target.value)}
                onBlur={saveDeliveryFee}
                className="w-16 border border-ink/20 p-1.5 font-body text-sm text-center focus:border-forest focus:outline-none"
              />
              <span className="font-tag text-sm">€</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/15 mt-4 pt-4">
        <p className="font-tag text-xs uppercase text-muted mb-2">
          Texte de la bannière d'accueil
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
          <div>
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Petit texte (ex : 250 références)
            </label>
            <input
              type="text"
              value={badgeDraft ?? ''}
              onChange={(e) => setBadgeDraft(e.target.value)}
              onBlur={saveBadge}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Grand titre
            </label>
            <input
              type="text"
              value={titreDraft ?? ''}
              onChange={(e) => setTitreDraft(e.target.value)}
              onBlur={saveTitre}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Sous-texte
            </label>
            <textarea
              rows={2}
              value={sousTitreDraft ?? ''}
              onChange={(e) => setSousTitreDraft(e.target.value)}
              onBlur={saveSousTitre}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-ink/15 mt-4 pt-4">
        <p className="font-tag text-xs uppercase text-muted mb-2">
          Bandeau du haut et coordonnées (bandeau, pied de page)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
          <div className="sm:col-span-2">
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Bandeau tout en haut du site
            </label>
            <input
              type="text"
              value={bandeauDraft ?? ''}
              onChange={(e) => setBandeauDraft(e.target.value)}
              onBlur={saveBandeau}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Téléphone
            </label>
            <input
              type="text"
              value={telDraft ?? ''}
              onChange={(e) => setTelDraft(e.target.value)}
              onBlur={saveTel}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Email de contact
            </label>
            <input
              type="email"
              value={emailDraft ?? ''}
              onChange={(e) => setEmailDraft(e.target.value)}
              onBlur={saveEmail}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-tag text-[10px] uppercase text-muted mb-1">
              Adresse (affichée en pied de page)
            </label>
            <input
              type="text"
              value={adresseDraft ?? ''}
              onChange={(e) => setAdresseDraft(e.target.value)}
              onBlur={saveAdresse}
              className="w-full border border-ink/20 p-1.5 font-body text-sm focus:border-forest focus:outline-none"
            />
          </div>
        </div>
      </div>
        </div>
      )}

      {editing === 'hero' && (
        <PhotoEditorModal
          title="Photo vitrine (page d'accueil)"
          initialUrl={settings.hero_url}
          initialZoom={settings.hero_zoom ?? 1}
          initialPosX={settings.hero_pos_x ?? 50}
          initialPosY={settings.hero_pos_y ?? 50}
          onUpload={(file) => uploadSiteImage(file, 'vitrine')}
          onSave={({ url, zoom, posX, posY }) =>
            updateSettings({
              hero_url: url,
              hero_zoom: zoom,
              hero_pos_x: posX,
              hero_pos_y: posY,
            })
          }
          onClose={() => setEditing(null)}
        />
      )}

      {editing === 'logo' && (
        <PhotoEditorModal
          title="Logo"
          initialUrl={settings.logo_url}
          initialZoom={1}
          initialPosX={50}
          initialPosY={50}
          onUpload={(file) => uploadSiteImage(file, 'logo')}
          onSave={({ url }) => updateSettings({ logo_url: url })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

export default function AdminPage() {
  const { products, loading, error, updateProduct, uploadPhotoOnly, refetch, createProduct, deleteProduct } = useProducts()
  const categoriesHook = useCategories()
  const { categories, subcategoriesByCategory } = categoriesHook
  const [editingProduct, setEditingProduct] = useState(null)
  const [detailsProduct, setDetailsProduct] = useState(null)
  const [variantsProduct, setVariantsProduct] = useState(null)
  const [tab, setTab] = useState('produits') // 'produits' | 'commandes' | 'categories' | 'occasions' | 'fournisseurs'
  const [searchText, setSearchText] = useState('')
  const [promoOnly, setPromoOnly] = useState(false)
  const [showNewProductModal, setShowNewProductModal] = useState(false)

  const handleDeleteProduct = async (product) => {
    if (
      confirm(
        `Supprimer définitivement "${product.nom}" ? Cette action est irréversible.`
      )
    ) {
      try {
        await deleteProduct(product.id)
      } catch (err) {
        alert(`Erreur : ${err.message}`)
      }
    }
  }

  const toggleStock = async (product) => {
    try {
      await updateProduct(product.id, { en_rupture: !product.en_rupture })
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const toggleActive = async (product) => {
    try {
      await updateProduct(product.id, { actif: !(product.actif !== false) })
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    }
  }

  const promoCount = products.filter((p) => p.en_promo).length
  const q = searchText.trim().toLowerCase()
  const filteredProducts = products.filter(
    (p) =>
      (!promoOnly || p.en_promo) &&
      (!q || p.nom?.toLowerCase().includes(q) || p.code_article?.toLowerCase().includes(q))
  )

  if (loading) {
    return <div className="p-8 font-body text-sm text-muted">Chargement du catalogue…</div>
  }

  if (error) {
    return (
      <div className="p-8 font-body text-sm text-rust">
        Erreur de connexion à Supabase : {error}
        <br />
        Vérifie ton fichier .env.local et que la table "produits" existe.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone">
      <header className="bg-ink text-paper px-6 py-4 flex items-center justify-between">
        <h1 className="font-display text-2xl tracking-wide">ELORN GEL — Administration</h1>
        <div className="flex gap-4">
          <a href="#" className="font-tag text-xs uppercase text-stone/80 hover:text-paper">
            Voir le site
          </a>
          <button
            onClick={() => {
              adminLogout()
              window.location.reload()
            }}
            className="font-tag text-xs uppercase text-stone/80 hover:text-paper"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="px-3 py-5 max-w-[1800px] mx-auto">
        <SiteSettingsPanel />

        <div className="flex border border-ink/40 font-tag text-xs font-semibold uppercase w-fit mb-4">
          <button
            onClick={() => setTab('produits')}
            className={`px-4 py-2 ${tab === 'produits' ? 'bg-ink text-paper' : 'text-ink'}`}
          >
            Produits
          </button>
          <button
            onClick={() => setTab('commandes')}
            className={`px-4 py-2 border-l border-ink/40 ${
              tab === 'commandes' ? 'bg-ink text-paper' : 'text-ink'
            }`}
          >
            Commandes
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`px-4 py-2 border-l border-ink/40 ${
              tab === 'categories' ? 'bg-ink text-paper' : 'text-ink'
            }`}
          >
            Catégories
          </button>
          <button
            onClick={() => setTab('occasions')}
            className={`px-4 py-2 border-l border-ink/40 ${
              tab === 'occasions' ? 'bg-ink text-paper' : 'text-ink'
            }`}
          >
            Occasions
          </button>
          <button
            onClick={() => setTab('fournisseurs')}
            className={`px-4 py-2 border-l border-ink/40 ${
              tab === 'fournisseurs' ? 'bg-ink text-paper' : 'text-ink'
            }`}
          >
            Fournisseurs
          </button>
        </div>

        {tab === 'commandes' ? (
          <OrdersPanel />
        ) : tab === 'categories' ? (
          <CategoriesPanel {...categoriesHook} />
        ) : tab === 'occasions' ? (
          <OccasionsPanel allProducts={products} />
        ) : tab === 'fournisseurs' ? (
          <SuppliersPanel />
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Rechercher un produit (nom ou référence)…"
                className="border border-ink/30 px-3 py-2 font-body text-sm w-full max-w-xs focus:border-forest focus:outline-none"
              />
              <button
                onClick={() => setPromoOnly((v) => !v)}
                className={`font-tag text-xs font-semibold uppercase px-3 py-2 border ${
                  promoOnly
                    ? 'border-rust bg-rust text-paper'
                    : 'border-rust text-rust hover:bg-rust/10'
                }`}
              >
                {promoOnly ? 'Promos uniquement' : 'Voir les promos'} ({promoCount})
              </button>
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="font-tag text-xs uppercase text-muted hover:text-ink"
                >
                  Effacer
                </button>
              )}
              <button
                onClick={() => setShowNewProductModal(true)}
                className="bg-ink text-paper font-tag text-xs font-semibold uppercase px-3 py-2 hover:bg-forest ml-auto"
              >
                + Nouveau produit
              </button>
            </div>

            <p className="font-body text-sm text-muted mb-4">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
              {searchText || promoOnly ? ` trouvé${filteredProducts.length !== 1 ? 's' : ''}` : ''}
              {promoOnly ? ' en promotion (active, programmée ou terminée)' : ''}.
              Clique sur la photo pour la choisir et la régler (molette pour zoomer,
              glisser pour recentrer). Les autres champs se sauvegardent
              automatiquement quand tu cliques ailleurs.
            </p>

        <div className="bg-paper border border-ink/15 overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="border-b border-ink/15 font-tag text-[11px] uppercase text-muted">
                <th className="px-1.5 py-2 w-[52px]">Photo</th>
                <th className="px-1.5 py-2 w-[48px]">Réf.</th>
                <th className="px-1.5 py-2">Désignation</th>
                <th className="px-1.5 py-2 w-[150px]">Catégorie</th>
                <th className="px-1.5 py-2 w-[92px]">Fournisseur</th>
                <th className="px-1.5 py-2 w-[74px]">Poids</th>
                <th className="px-1.5 py-2 w-[60px]">Prix livr.</th>
                <th className="px-1.5 py-2 w-[76px]">Prix / kg</th>
                <th className="px-1.5 py-2 w-[84px]">Stock / Publié / Accueil</th>
                <th className="px-1.5 py-2 w-[124px]">Promo</th>
                <th className="px-1.5 py-2 w-[62px]">Fiche</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-ink/10 ${
                    product.en_rupture || product.actif === false ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-1.5 py-2 align-top">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="block w-11 h-11 bg-stone border border-ink/15 overflow-hidden relative"
                    >
                      {product.photo_url ? (
                        <CroppableImage
                          src={product.photo_url}
                          zoom={product.photo_zoom ?? 1}
                          posX={product.photo_pos_x ?? 50}
                          posY={product.photo_pos_y ?? 50}
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full font-tag text-[9px] text-muted text-center px-1">
                          Ajouter
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <EditableCell
                      value={product.code_article}
                      onSave={(v) => updateProduct(product.id, { code_article: v })}
                      width="w-full"
                    />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <EditableCell
                      value={product.nom}
                      onSave={(v) => updateProduct(product.id, { nom: v })}
                      multiline
                    />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <CategorySelect
                      value={product.categorie}
                      onSave={(v) => updateProduct(product.id, { categorie: v })}
                      categories={categories}
                    />
                    <SubcategorySelect
                      categorie={product.categorie}
                      value={product.sous_categorie}
                      onSave={(v) => updateProduct(product.id, { sous_categorie: v })}
                      subcategoriesByCategory={subcategoriesByCategory}
                    />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <EditableCell
                      value={product.fournisseur}
                      onSave={(v) => updateProduct(product.id, { fournisseur: v })}
                    />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <EditableCell
                      value={product.poids}
                      onSave={(v) => updateProduct(product.id, { poids: v })}
                    />
                    {product.variantes?.length > 0 && (
                      <p
                        className="font-tag text-[10px] text-rust mt-1 leading-tight"
                        title='Ce produit a des conditionnements : leur poids se modifie via "Fiche" → Conditionnements.'
                      >
                        Non utilisé, voir Fiche
                      </p>
                    )}
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <EditableCell
                      type="number"
                      value={product.prix_livraison}
                      onSave={(v) =>
                        updateProduct(product.id, { prix_livraison: parseFloat(v) })
                      }
                    />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    {product.poids_reference ? (
                      <span className="font-tag text-xs text-forest">
                        {getPricePerUnitLabel(product, product.prix_livraison)}
                      </span>
                    ) : (
                      <EditableCell
                        value={product.prix_par_kg}
                        onSave={(v) => updateProduct(product.id, { prix_par_kg: v })}
                      />
                    )}
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => toggleStock(product)}
                        className={`font-tag text-[10px] uppercase font-semibold px-1 py-1 w-full leading-tight ${
                          product.en_rupture ? 'bg-rust text-paper' : 'bg-forest text-paper'
                        }`}
                      >
                        {product.en_rupture ? 'Bientôt de retour' : 'En stock'}
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        className={`font-tag text-[10px] uppercase font-semibold px-1 py-1 w-full border ${
                          product.actif !== false
                            ? 'border-ink/40 text-ink'
                            : 'border-rust bg-rust/10 text-rust'
                        }`}
                      >
                        {product.actif !== false ? 'Publié' : 'Masqué'}
                      </button>
                      <button
                        onClick={() =>
                          updateProduct(product.id, { mis_en_avant: !product.mis_en_avant })
                        }
                        className={`font-tag text-[10px] uppercase font-semibold px-1 py-1 w-full border ${
                          product.mis_en_avant
                            ? 'border-forest bg-forest text-paper'
                            : 'border-ink/40 text-ink'
                        }`}
                      >
                        {product.mis_en_avant ? 'En avant' : 'Standard'}
                      </button>
                    </div>
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <PromoEditor
                      key={[product.id, product.en_promo, product.taux_promo, product.prix_promo, product.promo_debut, product.promo_fin].join('|')}
                      product={product}
                      onSave={(changes) => updateProduct(product.id, changes)}
                    />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <button
                      onClick={() => setDetailsProduct(product)}
                      className={`font-tag text-[10px] uppercase font-semibold px-1 py-1 w-full border hover:bg-stone ${
                        product.poids_variable || product.variantes?.length > 0
                          ? 'border-forest text-forest'
                          : 'border-ink/40 text-ink'
                      }`}
                    >
                      Fiche
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      title="Supprimer définitivement ce produit"
                      className="font-tag text-[10px] uppercase text-rust mt-2 w-full hover:underline"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </main>

      {editingProduct && (
        <PhotoEditorModal
          title={editingProduct.nom}
          initialUrl={editingProduct.photo_url}
          initialZoom={editingProduct.photo_zoom ?? 1}
          initialPosX={editingProduct.photo_pos_x ?? 50}
          initialPosY={editingProduct.photo_pos_y ?? 50}
          onUpload={(file) => uploadPhotoOnly(editingProduct.id, file)}
          onSave={({ url, zoom, posX, posY }) =>
            updateProduct(editingProduct.id, {
              photo_url: url,
              photo_zoom: zoom,
              photo_pos_x: posX,
              photo_pos_y: posY,
            })
          }
          onClose={() => setEditingProduct(null)}
        />
      )}

      {detailsProduct && (
        <ProductDetailsModal
          product={detailsProduct}
          onSave={(changes) => updateProduct(detailsProduct.id, changes)}
          updateProduct={updateProduct}
          onOpenVariants={() => {
            setVariantsProduct(detailsProduct)
            setDetailsProduct(null)
          }}
          onClose={() => setDetailsProduct(null)}
          allProducts={products}
        />
      )}

      {variantsProduct && (
        <VariantsModal
          product={variantsProduct}
          onClose={() => {
            setVariantsProduct(null)
            refetch()
          }}
        />
      )}

      {showNewProductModal && (
        <NewProductModal
          categories={categories}
          subcategoriesByCategory={subcategoriesByCategory}
          onCreate={(values) => createProduct(values)}
          onClose={() => setShowNewProductModal(false)}
        />
      )}
    </div>
  )
}
