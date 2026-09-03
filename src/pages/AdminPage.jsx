import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { categories, subcategoriesByCategory } from '../data/products'
import CroppableImage from '../components/CroppableImage'
import PhotoEditorModal from '../components/PhotoEditorModal'
import ProductDetailsModal from '../components/ProductDetailsModal'
import { adminLogout } from '../components/AdminGate'
import OrdersPanel from '../components/OrdersPanel'
import VariantsModal from '../components/VariantsModal'

function EditableCell({ value, onSave, type = 'text', width = 'w-full' }) {
  const [draft, setDraft] = useState(value ?? '')

  return (
    <input
      type={type}
      className={`${width} bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-sm py-1`}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft)
      }}
    />
  )
}

function CategorySelect({ value, onSave }) {
  return (
    <select
      className="w-full bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-sm py-1 cursor-pointer"
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

function SubcategorySelect({ categorie, value, onSave }) {
  const options = subcategoriesByCategory[categorie] || []

  if (options.length === 0) {
    return <span className="font-tag text-xs text-muted">—</span>
  }

  return (
    <select
      className="w-full bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-sm py-1 cursor-pointer"
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
  const [discountDraft, setDiscountDraft] = useState(null)

  useEffect(() => {
    if (settings && discountDraft === null) {
      setDiscountDraft(settings.remise_retrait ?? 10)
    }
  }, [settings, discountDraft])

  if (loading || !settings) return null

  const saveDiscount = () => {
    const value = parseFloat(discountDraft)
    if (!isNaN(value) && value !== settings.remise_retrait) {
      updateSettings({ remise_retrait: value })
    }
  }

  return (
    <div className="bg-paper border border-ink/15 p-4 mb-6">
      <h2 className="font-display text-xl text-ink mb-3">Réglages du site</h2>
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
      </div>

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
  const { products, loading, error, updateProduct, uploadPhotoOnly, refetch } = useProducts()
  const [editingProduct, setEditingProduct] = useState(null)
  const [detailsProduct, setDetailsProduct] = useState(null)
  const [variantsProduct, setVariantsProduct] = useState(null)
  const [tab, setTab] = useState('produits') // 'produits' | 'commandes'

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

      <main className="p-6 max-w-7xl mx-auto">
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
        </div>

        {tab === 'commandes' ? (
          <OrdersPanel />
        ) : (
          <>
            <p className="font-body text-sm text-muted mb-4">
              {products.length} produits. Clique sur la photo pour la choisir et la régler
              (molette pour zoomer, glisser pour recentrer). Les autres champs se
              sauvegardent automatiquement quand tu cliques ailleurs.
            </p>

        <div className="bg-paper border border-ink/15 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink/15 font-tag text-xs uppercase text-muted">
                <th className="p-3 w-20">Photo</th>
                <th className="p-3 w-20">Réf.</th>
                <th className="p-3">Désignation</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Sous-catégorie</th>
                <th className="p-3">Fournisseur</th>
                <th className="p-3 w-28">Poids</th>
                <th className="p-3 w-28">Prix livr.</th>
                <th className="p-3 w-32">Prix / kg</th>
                <th className="p-3 w-32">Stock</th>
                <th className="p-3 w-28">Publié</th>
                <th className="p-3 w-28">Promo</th>
                <th className="p-3 w-20">Fiche</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`border-b border-ink/10 ${
                    product.en_rupture || product.actif === false ? 'opacity-50' : ''
                  }`}
                >
                  <td className="p-3">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="block w-14 h-14 bg-stone border border-ink/15 overflow-hidden relative"
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
                  <td className="p-3 font-tag text-xs text-muted">{product.code_article}</td>
                  <td className="p-3">
                    <EditableCell
                      value={product.nom}
                      onSave={(v) => updateProduct(product.id, { nom: v })}
                    />
                  </td>
                  <td className="p-3">
                    <CategorySelect
                      value={product.categorie}
                      onSave={(v) => updateProduct(product.id, { categorie: v })}
                    />
                  </td>
                  <td className="p-3">
                    <SubcategorySelect
                      categorie={product.categorie}
                      value={product.sous_categorie}
                      onSave={(v) => updateProduct(product.id, { sous_categorie: v })}
                    />
                  </td>
                  <td className="p-3">
                    <EditableCell
                      value={product.fournisseur}
                      onSave={(v) => updateProduct(product.id, { fournisseur: v })}
                    />
                  </td>
                  <td className="p-3">
                    <EditableCell
                      value={product.poids}
                      onSave={(v) => updateProduct(product.id, { poids: v })}
                    />
                  </td>
                  <td className="p-3">
                    <EditableCell
                      type="number"
                      value={product.prix_livraison}
                      onSave={(v) =>
                        updateProduct(product.id, { prix_livraison: parseFloat(v) })
                      }
                    />
                  </td>
                  <td className="p-3">
                    <EditableCell
                      value={product.prix_par_kg}
                      onSave={(v) => updateProduct(product.id, { prix_par_kg: v })}
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleStock(product)}
                      className={`font-tag text-[11px] uppercase font-semibold px-2.5 py-1.5 w-full ${
                        product.en_rupture
                          ? 'bg-rust text-paper'
                          : 'bg-forest text-paper'
                      }`}
                    >
                      {product.en_rupture ? 'Bientôt de retour' : 'En stock'}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`font-tag text-[11px] uppercase font-semibold px-2.5 py-1.5 w-full border ${
                        product.actif !== false
                          ? 'border-ink/40 text-ink'
                          : 'border-rust bg-rust/10 text-rust'
                      }`}
                    >
                      {product.actif !== false ? 'Publié' : 'Masqué'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() =>
                          updateProduct(product.id, { en_promo: !product.en_promo })
                        }
                        className={`font-tag text-[11px] uppercase font-semibold px-2.5 py-1.5 w-full border ${
                          product.en_promo
                            ? 'border-rust bg-rust text-paper'
                            : 'border-ink/40 text-ink'
                        }`}
                      >
                        {product.en_promo ? 'En promo' : 'Promo'}
                      </button>
                      {product.en_promo && (
                        <div className="flex items-center gap-1">
                          <EditableCell
                            type="number"
                            width="w-14"
                            value={product.taux_promo}
                            onSave={(v) =>
                              updateProduct(product.id, { taux_promo: parseFloat(v) || 0 })
                            }
                          />
                          <span className="font-tag text-xs">%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setDetailsProduct(product)}
                      className={`font-tag text-[11px] uppercase font-semibold px-2.5 py-1.5 w-full border hover:bg-stone ${
                        product.poids_variable || product.variantes?.length > 0
                          ? 'border-forest text-forest'
                          : 'border-ink/40 text-ink'
                      }`}
                    >
                      Fiche
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
    </div>
  )
}
