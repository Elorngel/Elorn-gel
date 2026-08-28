import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { categories } from '../data/products'

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

export default function AdminPage() {
  const { products, loading, error, updateProduct, uploadPhoto } = useProducts()
  const [uploadingId, setUploadingId] = useState(null)

  const handlePhotoChange = async (id, file) => {
    if (!file) return
    setUploadingId(id)
    try {
      await uploadPhoto(id, file)
    } catch (err) {
      alert(`Erreur upload photo : ${err.message}`)
    } finally {
      setUploadingId(null)
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
        <a href="#" className="font-tag text-xs uppercase text-stone/80 hover:text-paper">
          Voir le site
        </a>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <p className="font-body text-sm text-muted mb-4">
          {products.length} produits. Clique sur un champ pour le modifier, la sauvegarde
          se fait automatiquement quand tu cliques ailleurs.
        </p>

        <div className="bg-paper border border-ink/15 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ink/15 font-tag text-xs uppercase text-muted">
                <th className="p-3 w-20">Photo</th>
                <th className="p-3 w-20">Réf.</th>
                <th className="p-3">Désignation</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Fournisseur</th>
                <th className="p-3 w-28">Poids</th>
                <th className="p-3 w-28">Prix livr.</th>
                <th className="p-3 w-32">Prix / kg</th>
                <th className="p-3 w-32">Stock</th>
                <th className="p-3 w-28">Publié</th>
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
                    <label className="block w-14 h-14 bg-stone border border-ink/15 cursor-pointer overflow-hidden relative">
                      {product.photo_url ? (
                        <img
                          src={product.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full font-tag text-[9px] text-muted text-center px-1">
                          Ajouter
                        </span>
                      )}
                      {uploadingId === product.id && (
                        <span className="absolute inset-0 bg-ink/60 flex items-center justify-center text-paper text-[9px]">
                          …
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoChange(product.id, e.target.files[0])}
                      />
                    </label>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
