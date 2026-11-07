import { GROUPES_FILTRES, FILTRES_VIDES } from '../lib/filtresProduits'

// Barre de filtres de la liste des produits (admin). Logique dans src/lib/filtresProduits.js.
export default function FiltresProduits({ produits, categories, valeur, onChange }) {
  const { actifs, categorie, fournisseur } = valeur
  const basculer = (id) =>
    onChange({ ...valeur, actifs: actifs.includes(id) ? actifs.filter((x) => x !== id) : [...actifs, id] })
  const fournisseurs = [...new Set(produits.map((p) => String(p.fournisseur || '').trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'fr')
  )
  const nbActifs = actifs.length + (categorie ? 1 : 0) + (fournisseur ? 1 : 0)
  const select =
    'border border-ink/30 bg-paper px-2 py-1.5 font-body text-sm focus:border-forest focus:outline-none max-w-[220px]'

  return (
    <div className="bg-paper border border-ink/15 p-3 mb-4">
      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {GROUPES_FILTRES.map((g) => (
          <div key={g.titre}>
            <p className="font-tag text-[10px] uppercase text-muted mb-1">{g.titre}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.filtres.map((f) => {
                const on = actifs.includes(f.id)
                const nb = produits.filter(f.test).length
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => basculer(f.id)}
                    className={`font-tag text-xs font-semibold uppercase px-2.5 py-1.5 border ${
                      on ? 'border-forest bg-forest text-paper' : 'border-ink/30 text-ink hover:bg-stone'
                    }`}
                  >
                    {f.libelle} <span className={on ? 'text-paper/80' : 'text-muted'}>({nb})</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div>
          <p className="font-tag text-[10px] uppercase text-muted mb-1">Rayon</p>
          <select value={categorie} onChange={(e) => onChange({ ...valeur, categorie: e.target.value })} className={select}>
            <option value="">Tous les rayons</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="font-tag text-[10px] uppercase text-muted mb-1">Fournisseur</p>
          <select value={fournisseur} onChange={(e) => onChange({ ...valeur, fournisseur: e.target.value })} className={select}>
            <option value="">Tous les fournisseurs</option>
            <option value="__aucun__">Sans fournisseur</option>
            {fournisseurs.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        {nbActifs > 0 && (
          <button
            type="button"
            onClick={() => onChange(FILTRES_VIDES)}
            className="self-end font-tag text-xs uppercase underline text-muted hover:text-rust py-1.5"
          >
            Retirer les filtres ({nbActifs})
          </button>
        )}
      </div>
    </div>
  )
}
