// Champs d'un compte client, utilisés à la création du compte (dans le panier ou dans
// « Mon compte ») et pour modifier ses informations.
export const SOURCES = [
  'Facebook',
  'Instagram',
  'Bouche-à-oreille',
  'Recherche Google',
  'Publicité',
  'Déjà client Bontin',
  'Autre',
]

export const COMPTE_VIDE = {
  prenom: '',
  nom: '',
  email: '',
  motDePasse: '',
  telephone: '',
  dateNaissance: '',
  adresse: '',
  codePostal: '',
  ville: '',
  complement: '',
  source: '',
  accepteCgv: false,
  accepteOffres: false,
}

const champ =
  'w-full border border-ink/20 p-2 font-body text-sm bg-paper focus:border-forest focus:outline-none'
const etiquette = 'block font-tag text-[11px] uppercase text-muted mb-1'

export default function ChampsCompte({ valeurs, onChange, creation = true, idPrefixe = 'compte' }) {
  const id = (n) => `${idPrefixe}-${n}`
  const texte = (nom, label, props = {}) => (
    <div className={props.className}>
      <label htmlFor={id(nom)} className={etiquette}>
        {label}
      </label>
      <input
        id={id(nom)}
        required={props.required !== false}
        type={props.type || 'text'}
        value={valeurs[nom]}
        onChange={(e) => onChange(nom, e.target.value)}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        pattern={props.pattern}
        minLength={props.minLength}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
        className={champ}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {texte('prenom', 'Prénom', { autoComplete: 'given-name' })}
        {texte('nom', 'Nom', { autoComplete: 'family-name' })}
      </div>
      {creation && texte('email', 'Email', { type: 'email', autoComplete: 'email' })}
      {creation &&
        texte('motDePasse', 'Mot de passe (8 caractères minimum)', {
          type: 'password',
          autoComplete: 'new-password',
          minLength: 8,
        })}
      <div className="grid grid-cols-2 gap-3">
        {texte('telephone', 'Téléphone', { type: 'tel', autoComplete: 'tel' })}
        {texte('dateNaissance', 'Date de naissance', { type: 'date', autoComplete: 'bday' })}
      </div>
      {texte('adresse', 'Adresse (numéro et rue)', { autoComplete: 'address-line1' })}
      <div className="grid grid-cols-[110px_1fr] gap-3">
        {texte('codePostal', 'Code postal', {
          inputMode: 'numeric',
          pattern: '[0-9]{5}',
          maxLength: 5,
          autoComplete: 'postal-code',
        })}
        {texte('ville', 'Ville', { autoComplete: 'address-level2' })}
      </div>
      {texte('complement', "Complément d'adresse (facultatif : étage, digicode…)", {
        required: false,
        autoComplete: 'address-line2',
      })}

      {creation && (
        <div>
          <label htmlFor={id('source')} className={etiquette}>
            Comment nous avez-vous connus ? (facultatif)
          </label>
          <select
            id={id('source')}
            value={valeurs.source}
            onChange={(e) => onChange('source', e.target.value)}
            className={champ}
          >
            <option value="">— choisir —</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <label className="flex items-start gap-2 font-body text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={valeurs.accepteOffres}
          onChange={(e) => onChange('accepteOffres', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-forest shrink-0"
        />
        <span>
          J'accepte de recevoir les offres Bontin par email, dont mon bon d'achat d'anniversaire.
          Désinscription possible à tout moment depuis « Mon compte ».
        </span>
      </label>

      {creation && (
        <label className="flex items-start gap-2 font-body text-sm cursor-pointer">
          <input
            type="checkbox"
            required
            checked={valeurs.accepteCgv}
            onChange={(e) => onChange('accepteCgv', e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-forest shrink-0"
          />
          <span>
            J'accepte les{' '}
            <a href="#cgv" target="_blank" rel="noopener noreferrer" className="underline">
              conditions générales de vente
            </a>{' '}
            et la{' '}
            <a href="#confidentialite" target="_blank" rel="noopener noreferrer" className="underline">
              politique de confidentialité
            </a>
            .
          </span>
        </label>
      )}
    </div>
  )
}
