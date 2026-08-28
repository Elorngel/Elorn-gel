export default function Hero() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] border-b border-ink/15">
      <div className="bg-forest text-paper px-8 py-10 flex flex-col justify-center">
        <span className="font-tag text-xs uppercase tracking-widest text-stone/80 mb-2">
          250 références
        </span>
        <h1 className="font-display text-5xl md:text-6xl leading-[0.95] mb-4">
          Le surgelé,
          <br />
          en livraison ou en retrait
        </h1>
        <p className="font-body text-sm text-stone/90 max-w-md mb-6">
          Commandez chez vous, récupérez en point de retrait et économisez 20%
          sur chaque commande retirée sur place.
        </p>
        <button className="w-fit bg-rust text-paper font-tag text-sm font-semibold uppercase tracking-wide px-5 py-2.5 hover:bg-rust/90 transition-colors">
          Voir le catalogue
        </button>
      </div>
      <div className="relative bg-stone flex items-center justify-center min-h-[220px] overflow-hidden">
        <img
          src="/images/vitrine.jpg"
          alt="Elorn Gel"
          className="w-full h-full object-cover absolute inset-0"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        <span
          className="font-tag text-xs uppercase text-muted relative"
          style={{ display: 'none' }}
        >
          Photo produit / vitrine
        </span>
      </div>
    </section>
  )
}
