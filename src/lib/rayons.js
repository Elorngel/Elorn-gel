// Un produit a un rayon principal (categorie / sous_categorie) et peut apparaître dans d'autres rayons
// (colonne autres_rayons : liste de { categorie, sous_categorie }).
export const autresRayons = (produit) => (Array.isArray(produit?.autres_rayons) ? produit.autres_rayons : [])

export function estDansRayon(produit, categorie, sousCategorie = null) {
  const pareil = (cat, sous) => cat === categorie && (!sousCategorie || sous === sousCategorie)
  return (
    pareil(produit.categorie, produit.sous_categorie) ||
    autresRayons(produit).some((r) => pareil(r.categorie, r.sous_categorie))
  )
}

// Rayon renommé ou supprimé : met à jour la liste d'un produit. Renvoie null si rien ne change.
export function rayonsApresRenommage(liste, ancienCat, nouveauCat, ancienneSous = null, nouvelleSous = null) {
  let change = false
  const suite = liste.map((r) => {
    if (r.categorie !== ancienCat) return r
    if (ancienneSous) {
      if (r.sous_categorie !== ancienneSous) return r
      change = true
      return { ...r, sous_categorie: nouvelleSous }
    }
    change = true
    return { ...r, categorie: nouveauCat }
  })
  return change ? suite : null
}

export function rayonsApresSuppression(liste, categorie, sousCategorie = null) {
  // Sous-rayon supprimé : le produit reste dans le rayon. Rayon supprimé : on retire la ligne.
  const suite = sousCategorie
    ? liste.map((r) => (r.categorie === categorie && r.sous_categorie === sousCategorie ? { ...r, sous_categorie: null } : r))
    : liste.filter((r) => r.categorie !== categorie)
  return JSON.stringify(suite) === JSON.stringify(liste) ? null : suite
}
