// Les deux pastilles du flyer de parrainage : « 25 € offerts sur votre prochaine commande » +
// « 25 € offerts sur la commande de votre filleul ». Montant réglable dans l'admin (onglet Offres).
function Pastille({ montant, texte }) {
  return (
    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#c9a35e] border-2 border-ink text-ink flex flex-col items-center justify-center text-center px-3 shrink-0">
      <span className="font-display text-4xl sm:text-5xl leading-none">{montant}€</span>
      <span className="font-tag text-[10px] sm:text-[11px] font-bold uppercase leading-tight mt-1">{texte}</span>
    </div>
  )
}

export default function PastillesParrainage({ montant }) {
  const m = Number(montant ?? 25)
  const affiche = Number.isInteger(m) ? m : m.toFixed(2)
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <Pastille montant={affiche} texte="offerts sur votre prochaine commande" />
      <span className="font-display text-4xl text-current" aria-hidden="true">
        +
      </span>
      <Pastille montant={affiche} texte="offerts sur la commande de votre filleul" />
    </div>
  )
}
