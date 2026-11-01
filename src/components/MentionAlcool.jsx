// Mentions légales obligatoires pour la vente d'alcool (Code de la santé publique, art. L3342-1 et L3323-4).
export const MENTION_MINEURS = 'Vente d’alcool interdite aux mineurs de moins de 18 ans.'
export const MENTION_SANTE = 'L’abus d’alcool est dangereux pour la santé. À consommer avec modération.'

export default function MentionAlcool() {
  return (
    <p className="border-l-4 border-rust bg-rust/5 px-3 py-2 font-body text-xs text-ink">
      <strong>{MENTION_MINEURS}</strong> Une pièce d’identité peut être demandée à la remise de la commande.{' '}
      {MENTION_SANTE}
    </p>
  )
}
