import { useState } from 'react'
import { contenuFetes } from '../lib/fetes'

// Admin, liste de tous les produits (16/11/2026, demandé pour Sylvie) : ranger le produit dans la rubrique « Les fêtes »
// et choisir sa sous-catégorie directement depuis sa ligne, sans passer par l'onglet Fêtes. Enregistre aussitôt
// dans parametres_site.fetes (même liste que l'onglet Fêtes ; la case d'affichage de la rubrique n'est pas touchée).
const RETIRER = '__retirer__'
const SANS = '__sans__'

export default function ChoixFetes({ product, settings, updateSettings }) {
  const [enCours, setEnCours] = useState(false)
  if (!settings) return null
  const c = contenuFetes(settings.fetes)
  const entree = c.produits.find((p) => p.id === product.id)

  const enregistrer = async (produits) => {
    setEnCours(true)
    try {
      await updateSettings({ fetes: { ...c, produits } })
    } catch (err) {
      alert(`Erreur : ${err.message}`)
    } finally {
      setEnCours(false)
    }
  }

  const choisir = (valeur) => {
    if (!valeur) return
    if (valeur === RETIRER) {
      if (entree?.couverture && !confirm('Ce produit est une des photos de la bannière des fêtes. Le retirer quand même ?')) return
      enregistrer(c.produits.filter((p) => p.id !== product.id))
      return
    }
    const sr = valeur === SANS ? '' : valeur
    // Rangé après le dernier produit de la même sous-catégorie (sinon à la fin), pour garder l'ordre de la page.
    const autres = c.produits.filter((p) => p.id !== product.id)
    const ligne = { ...(entree || { id: product.id, couverture: false, phrase: '', nom: '' }), sr }
    let position = autres.length
    for (let i = autres.length - 1; i >= 0; i--) {
      if ((autres[i].sr || '') === sr) {
        position = i + 1
        break
      }
    }
    enregistrer([...autres.slice(0, position), ligne, ...autres.slice(position)])
  }

  const valeur = entree ? (c.sous_rayons.includes(entree.sr) ? entree.sr : SANS) : ''
  return (
    <select
      aria-label="Rubrique Les fêtes"
      title="Ranger ce produit dans la rubrique « Les fêtes »"
      disabled={enCours}
      value={valeur}
      onChange={(e) => choisir(e.target.value)}
      className={`w-full mt-0.5 focus:outline-none font-tag text-[10px] uppercase py-0.5 cursor-pointer ${
        entree
          ? 'border border-rust/50 bg-rust/10 text-rust px-1 font-semibold'
          : 'bg-transparent border-b border-transparent hover:border-ink/20 text-muted'
      }`}
    >
      {!entree && <option value="">+ les fêtes</option>}
      <optgroup label="Les fêtes">
        {c.sous_rayons.map((sr) => (
          <option key={sr} value={sr}>
            {entree ? `Fêtes › ${sr}` : sr}
          </option>
        ))}
        {entree && <option value={SANS}>Fêtes (sans sous-catégorie)</option>}
      </optgroup>
      {entree && <option value={RETIRER}>✕ Retirer des fêtes</option>}
    </select>
  )
}
