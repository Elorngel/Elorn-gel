import { autresRayons } from '../lib/rayons'

const SEPARATEUR = '|||'

// Admin : autres rayons dans lesquels le produit apparaît, en plus de son rayon principal.
export default function AutresRayons({ product, categories, subcategoriesByCategory, onSave }) {
  const liste = autresRayons(product)
  const pris = (cat, sous) =>
    (product.categorie === cat && (product.sous_categorie || null) === sous) ||
    liste.some((r) => r.categorie === cat && (r.sous_categorie || null) === sous)

  const ajouter = (valeur) => {
    if (!valeur) return
    const [categorie, sous] = valeur.split(SEPARATEUR)
    onSave({ autres_rayons: [...liste, { categorie, sous_categorie: sous || null }] })
  }

  return (
    <div className="mt-1">
      {liste.map((r) => (
        <span
          key={`${r.categorie}${SEPARATEUR}${r.sous_categorie || ''}`}
          className="flex items-center justify-between gap-1 border border-forest/40 bg-forest/10 text-forest font-tag text-[10px] leading-tight px-1 py-0.5 mb-0.5"
        >
          <span className="min-w-0">
            {r.categorie}
            {r.sous_categorie ? ` › ${r.sous_categorie}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onSave({ autres_rayons: liste.filter((x) => x !== r) })}
            className="shrink-0 font-bold hover:text-rust px-0.5"
            aria-label={`Retirer du rayon ${r.categorie}`}
          >
            ×
          </button>
        </span>
      ))}
      <select
        aria-label="Ajouter ce produit à un autre rayon"
        className="w-full bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-tag text-[10px] uppercase text-muted py-0.5 cursor-pointer"
        value=""
        onChange={(e) => ajouter(e.target.value)}
      >
        <option value="">+ autre rayon</option>
        {categories.map((cat) => {
          const sousRayons = (subcategoriesByCategory[cat] || []).filter((sous) => !pris(cat, sous))
          if (pris(cat, null) && sousRayons.length === 0) return null
          return (
            <optgroup key={cat} label={cat}>
              {!pris(cat, null) && <option value={cat}>{cat} (tout le rayon)</option>}
              {sousRayons.map((sous) => (
                <option key={sous} value={`${cat}${SEPARATEUR}${sous}`}>
                  {sous}
                </option>
              ))}
            </optgroup>
          )
        })}
      </select>
    </div>
  )
}
