export default function Footer() {
  return (
    <footer className="bg-ink text-stone mt-10">
      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <h3 className="font-tag text-xs uppercase font-semibold text-stone/60 mb-3">
            Mentions
          </h3>
          <ul className="flex flex-col gap-2 font-body text-sm">
            <li>
              <a href="#mentions-legales" className="hover:underline">
                Mentions légales
              </a>
            </li>
            <li>
              <a href="#cgv" className="hover:underline">
                Conditions générales de vente (CGV)
              </a>
            </li>
            <li>
              <a href="#cgu" className="hover:underline">
                Conditions générales d'utilisation (CGU)
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-tag text-xs uppercase font-semibold text-stone/60 mb-3">
            Contact
          </h3>
          <ul className="flex flex-col gap-2 font-body text-sm">
            <li>
              <a href="mailto:logistique@elorngel.fr" className="hover:underline">
                logistique@elorngel.fr
              </a>
            </li>
            <li>
              <a href="tel:0298205043" className="hover:underline">
                02 98 20 50 43
              </a>
            </li>
            <li className="text-stone/70">ZI de Keriel Nord, 29800 Plouédern</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone/15 px-5 py-3 text-center font-tag text-[11px] text-stone/50">
        © {new Date().getFullYear()} Elorn Gel — SAS au capital de 8 000,00 €
      </div>
    </footer>
  )
}
