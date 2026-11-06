import { useState } from 'react'
import { statistiquesRefusees, refuserStatistiques } from '../lib/statistiques'

// Sous la politique de confidentialité : le visiteur peut refuser d'être compté dans les statistiques
// de visites (Matomo). Le choix est retenu sur cet appareil.
export default function ChoixStatistiques() {
  const [refus, setRefus] = useState(statistiquesRefusees)

  const changer = () => {
    refuserStatistiques(!refus)
    setRefus(!refus)
  }

  return (
    <div className="mt-4 bg-paper border border-ink/15 p-5 flex flex-wrap items-center justify-between gap-3">
      <p className="font-body text-sm text-ink">
        {refus
          ? 'Vous n’êtes pas compté dans nos statistiques de visites sur cet appareil.'
          : 'Vos visites sont comptées de façon anonyme dans nos statistiques.'}
      </p>
      <button
        type="button"
        onClick={changer}
        className="font-tag text-xs uppercase font-semibold border border-forest text-forest px-4 py-2 hover:bg-forest hover:text-paper"
      >
        {refus ? 'Accepter d’être compté' : 'Ne plus être compté'}
      </button>
    </div>
  )
}
