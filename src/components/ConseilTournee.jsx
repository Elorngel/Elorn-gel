import { communeClient, conseilsLivraison } from '../lib/tournees'

// Conseil « Livraison groupée » au-dessus du choix du jour de livraison (panier, mode Livraison) — version B choisie
// par Romuald le 12/11/2026 : bloc vert forêt, dates en pages de calendrier, date choisie en brique.
// Affiché dans le panier seulement si l'admin a activé « Livraison groupée » (onglet Tournées → Réglages) ;
// aussi utilisé dans la simulation de l'admin.
// Rien ne s'affiche si la commune est dans la zone du dépôt, inconnue, ou sans tournée à venir à proximité.
const morceaux = (d) => {
  const x = new Date(`${d}T12:00:00`)
  return {
    jour: x.toLocaleDateString('fr-FR', { weekday: 'long' }),
    num: x.getDate(),
    mois: x.toLocaleDateString('fr-FR', { month: 'long' }),
  }
}
const dateLongue = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function ConseilTournee({
  commune: communeDonnee,
  codePostal,
  ville,
  tournees,
  aujourdhui,
  rayonDepot,
  rayonTournee,
  dateChoisie,
  onChoisir,
  conseils: conseilsDonnes,
}) {
  // Le panier passe directement ses conseils (déjà filtrés par le calendrier) ; sinon on les calcule.
  let conseils = conseilsDonnes
  if (!conseils) {
    const commune = communeDonnee || communeClient(codePostal, ville)
    if (!commune) return null
    conseils = conseilsLivraison(commune, tournees, { aujourdhui, rayonDepot, rayonTournee }).conseils
  }
  const prochains = conseils.slice(0, 3)
  if (!prochains.length) return null
  const une = prochains.length === 1

  return (
    <div className="bg-forest text-paper mb-3">
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <p className="font-display text-2xl leading-none tracking-wide">Livraison groupée</p>
        <span className="font-tag text-[10px] uppercase border border-paper/60 px-1.5 py-0.5 shrink-0">🌿 Éco</span>
      </div>
      <p className="font-body text-sm px-3 mt-2">
        <strong>
          {une
            ? `Un camion Bontin passe près de chez vous le ${dateLongue(prochains[0].date)}.`
            : 'Un camion Bontin passe près de chez vous ces jours-ci.'}
        </strong>
      </p>
      <p className="font-body text-xs text-stone/90 px-3 mt-1">
        Si {une ? 'cette date vous convient' : "l'une de ces dates vous convient"}, choisissez-la : en regroupant les
        livraisons d'un même secteur, nous faisons moins de kilomètres et limitons notre impact sur l'environnement.
      </p>
      <div className={`grid gap-1.5 p-3 ${prochains.length === 3 ? 'grid-cols-3' : prochains.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {prochains.map((c) => {
          const m = morceaux(c.date)
          const choisie = dateChoisie === c.date
          return (
            <button
              key={c.date}
              type="button"
              onClick={() => onChoisir?.(c.date)}
              aria-pressed={choisie}
              className={`text-center py-2 transition-colors ${choisie ? 'bg-rust text-paper' : 'bg-paper text-ink hover:bg-stone'}`}
            >
              <span className="block font-tag text-[10px] uppercase">{m.jour}</span>
              <span className="block font-display text-3xl leading-none">{m.num}</span>
              <span className="block font-tag text-[10px] uppercase">{m.mois}</span>
            </button>
          )
        })}
      </div>
      <p className="font-body text-[11px] italic text-stone/80 px-3 pb-3">
        Ce n'est qu'une suggestion : vous restez libre de choisir le jour qui vous arrange.
      </p>
    </div>
  )
}
