import { useState } from 'react'
import { useOccasions } from '../hooks/useOccasions'
import {
  MAX_QUESTIONS,
  MAX_REPONSES,
  MAX_PRODUITS,
  MIN_PRODUITS,
  getCombinaisons,
} from '../lib/occasions'

// Affiche l'erreur à l'admin au lieu de la laisser passer en silence.
// Renvoie false en cas d'erreur, pour que les formulaires gardent le texte saisi.
const safe =
  (fn) =>
  async (...args) => {
    try {
      await fn(...args)
      return true
    } catch (err) {
      alert(`Erreur : ${err.message}`)
      return false
    }
  }

// Champ texte qui se sauvegarde quand on clique ailleurs (comme le reste de l'admin).
function EditableText({ value, onSave, className = '', placeholder }) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = draft.trim()
        if (next && next !== value) onSave(next)
        else setDraft(value)
      }}
      className={`bg-transparent border-b border-transparent hover:border-ink/20 focus:border-forest focus:outline-none font-body text-sm py-1 min-w-0 ${className}`}
    />
  )
}

// Petit formulaire "un champ + un bouton" pour ajouter une question, une réponse…
function AddForm({ placeholder, buttonLabel, onAdd, className = '' }) {
  const [draft, setDraft] = useState('')
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const value = draft.trim()
        if (!value) return
        if ((await onAdd(value)) !== false) setDraft('')
      }}
      className={`flex items-center gap-2 ${className}`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 min-w-0 border border-ink/20 p-1.5 font-body text-xs focus:border-forest focus:outline-none"
      />
      <button
        type="submit"
        className="font-tag text-[10px] uppercase font-semibold px-2 py-1.5 border border-ink/40 hover:bg-stone shrink-0"
      >
        {buttonLabel}
      </button>
    </form>
  )
}

// Édition d'une combinaison de réponses : texte d'intro + 2 à 6 produits.
function ComboEditor({ occasion, combo, allProducts, hook }) {
  const selection = combo.selection
  const [introDraft, setIntroDraft] = useState(selection?.intro ?? '')
  const [search, setSearch] = useState('')

  const rows = (selection?.produits || [])
    .map((row) => ({ row, produit: allProducts.find((p) => p.id === row.produit_id) }))
    .filter((x) => x.produit)

  const results = search.trim()
    ? allProducts
        .filter(
          (p) =>
            p.actif !== false &&
            !rows.some((x) => x.produit.id === p.id) &&
            p.nom.toLowerCase().includes(search.trim().toLowerCase())
        )
        .slice(0, 8)
    : []

  return (
    <div className="bg-stone/60 border border-ink/10 p-3 mt-2">
      <label className="block font-tag text-[10px] uppercase text-muted mb-1">
        Texte d'intro (optionnel, affiché au-dessus des produits)
      </label>
      <textarea
        rows={2}
        value={introDraft}
        onChange={(e) => setIntroDraft(e.target.value)}
        onBlur={() => {
          if (introDraft.trim() !== (selection?.intro ?? '')) {
            safe(hook.saveIntro)(occasion, combo, introDraft)
          }
        }}
        placeholder="Ex : Pour 6 à 8 personnes, voici de quoi tenir sans passer la soirée en cuisine."
        className="w-full border border-ink/20 p-1.5 font-body text-sm mb-3 bg-paper focus:border-forest focus:outline-none"
      />

      <p className="font-tag text-[10px] uppercase text-muted mb-1">
        Produits ({rows.length}/{MAX_PRODUITS}) — vise {MIN_PRODUITS} à {MAX_PRODUITS}
      </p>

      {rows.length > 0 ? (
        <div className="flex flex-col gap-1 mb-2">
          {rows.map(({ row, produit }) => (
            <div key={row.id} className="flex items-center justify-between bg-paper p-2">
              <span className="font-body text-sm">{produit.nom}</span>
              <button
                onClick={safe(() => hook.removeProduit(row.id))}
                className="font-tag text-[10px] uppercase text-rust shrink-0 ml-2"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-xs text-muted mb-2">Aucun produit pour l'instant.</p>
      )}

      {rows.length < MAX_PRODUITS ? (
        <>
          <input
            type="text"
            placeholder="Chercher un produit à ajouter…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-ink/20 p-1.5 font-body text-sm bg-paper focus:border-forest focus:outline-none"
          />
          {results.length > 0 && (
            <div className="border border-ink/15 bg-paper mt-1 max-h-40 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={safe(async () => {
                    await hook.addProduit(occasion, combo, p.id)
                    setSearch('')
                  })}
                  className="block w-full text-left px-2 py-1.5 font-body text-sm hover:bg-stone border-b border-ink/10 last:border-b-0"
                >
                  {p.nom}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="font-tag text-[11px] text-muted">
          Maximum de {MAX_PRODUITS} produits atteint — retire-en un pour en ajouter un autre.
        </p>
      )}
    </div>
  )
}

function statutCombo(combo) {
  const n = combo.selection?.produits.length ?? 0
  if (n === 0) return { label: 'À remplir', className: 'border-rust text-rust' }
  if (n < MIN_PRODUITS) return { label: `${n} produit`, className: 'border-rust text-rust' }
  return { label: `${n} produits`, className: 'border-forest bg-forest text-paper' }
}

function OccasionCard({ occasion, expanded, onToggle, allProducts, hook }) {
  const [openCombo, setOpenCombo] = useState(null)
  const combos = getCombinaisons(occasion)
  const remplies = combos.filter((c) => (c.selection?.produits.length ?? 0) >= MIN_PRODUITS).length
  const questionsSansReponse = occasion.questions.filter((q) => q.reponses.length === 0)

  return (
    <div className="bg-paper border border-ink/15 p-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          aria-label={expanded ? 'Replier' : 'Déplier'}
          className="font-tag text-sm text-muted w-5 shrink-0"
        >
          {expanded ? '▾' : '▸'}
        </button>
        <EditableText
          value={occasion.nom}
          onSave={safe((nom) => hook.renameOccasion(occasion.id, nom))}
          className="flex-1 font-semibold"
        />
        <span className="font-tag text-[11px] text-muted shrink-0 hidden sm:inline">
          {remplies}/{combos.length} rempli{remplies > 1 ? 'es' : 'e'}
        </span>
        <button
          onClick={safe(() => hook.setOccasionActive(occasion.id, !occasion.actif))}
          className={`font-tag text-[11px] uppercase font-semibold px-2.5 py-1 border shrink-0 ${
            occasion.actif ? 'border-ink/40 text-ink' : 'border-rust bg-rust/10 text-rust'
          }`}
        >
          {occasion.actif ? 'Publiée' : 'Masquée'}
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                `Supprimer l'occasion "${occasion.nom}" avec ses questions et ses sélections ?`
              )
            ) {
              safe(() => hook.deleteOccasion(occasion.id))()
            }
          }}
          className="font-tag text-[10px] uppercase text-rust shrink-0"
        >
          Suppr.
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-ink/10">
          <p className="font-tag text-xs uppercase text-muted mb-2">
            Questions filtres ({occasion.questions.length}/{MAX_QUESTIONS})
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {occasion.questions.map((question) => (
              <div key={question.id} className="border border-ink/15 p-2">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-ink/10">
                  <EditableText
                    value={question.libelle}
                    onSave={safe((libelle) => hook.renameQuestion(question.id, libelle))}
                    className="flex-1 font-semibold"
                  />
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Supprimer la question "${question.libelle}" ? Les sélections qui utilisent ses réponses seront supprimées.`
                        )
                      ) {
                        safe(() => hook.deleteQuestion(question.id))()
                      }
                    }}
                    className="font-tag text-[10px] uppercase text-rust shrink-0"
                  >
                    Suppr.
                  </button>
                </div>

                <div className="flex flex-col gap-1 mb-2">
                  {question.reponses.map((reponse) => (
                    <div key={reponse.id} className="flex items-center gap-2">
                      <span className="font-tag text-xs text-muted">—</span>
                      <EditableText
                        value={reponse.libelle}
                        onSave={safe((libelle) => hook.renameReponse(reponse.id, libelle))}
                        className="flex-1"
                      />
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Supprimer la réponse "${reponse.libelle}" ? Les sélections qui l'utilisent seront supprimées.`
                            )
                          ) {
                            safe(() => hook.deleteReponse(reponse.id))()
                          }
                        }}
                        className="font-tag text-[10px] uppercase text-rust shrink-0"
                      >
                        Suppr.
                      </button>
                    </div>
                  ))}
                  {question.reponses.length === 0 && (
                    <p className="font-tag text-xs text-rust">
                      Aucune réponse : cette question n'est pas posée aux clients.
                    </p>
                  )}
                </div>

                {question.reponses.length < MAX_REPONSES ? (
                  <AddForm
                    placeholder="Nouvelle réponse (ex : 6 à 8 personnes)"
                    buttonLabel="Ajouter"
                    onAdd={safe((libelle) => hook.addReponse(question, libelle))}
                  />
                ) : (
                  <p className="font-tag text-[11px] text-muted">
                    {MAX_REPONSES} réponses maximum par question.
                  </p>
                )}
              </div>
            ))}
          </div>

          {occasion.questions.length < MAX_QUESTIONS && (
            <AddForm
              placeholder={
                occasion.questions.length === 0
                  ? 'Première question (ex : Vous serez combien ?) — facultatif'
                  : 'Seconde question (ex : Plutôt prêt à servir ou à cuisiner ?)'
              }
              buttonLabel="Ajouter une question"
              onAdd={safe((libelle) => hook.addQuestion(occasion, libelle))}
              className="max-w-xl mb-3"
            />
          )}

          <div className="border-t border-ink/10 pt-3">
            <p className="font-tag text-xs uppercase text-muted mb-1">
              Sélections de produits ({remplies}/{combos.length} remplies)
            </p>
            <p className="font-body text-xs text-muted mb-2">
              Une sélection par combinaison de réponses. Ce que voit le client quand il choisit
              exactement ces réponses.
              {questionsSansReponse.length > 0 &&
                ' Ajoute des réponses à chaque question pour voir toutes les combinaisons.'}
            </p>

            <div className="flex flex-col gap-1">
              {combos.map((combo) => {
                const statut = statutCombo(combo)
                const isOpen = openCombo === combo.key
                return (
                  <div key={combo.key}>
                    <button
                      onClick={() => setOpenCombo(isOpen ? null : combo.key)}
                      className="flex items-center justify-between gap-2 w-full text-left border border-ink/15 px-2.5 py-2 hover:bg-stone"
                    >
                      <span className="font-body text-sm">{combo.libelle}</span>
                      <span
                        className={`font-tag text-[10px] uppercase font-semibold px-2 py-0.5 border shrink-0 ${statut.className}`}
                      >
                        {statut.label}
                      </span>
                    </button>
                    {isOpen && (
                      <ComboEditor
                        // Repart d'un formulaire propre si la sélection change ailleurs
                        key={`${combo.key}-${combo.selection?.id ?? 'new'}`}
                        occasion={occasion}
                        combo={combo}
                        allProducts={allProducts}
                        hook={hook}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OccasionsPanel({ allProducts }) {
  const hook = useOccasions()
  const { occasions, loading, error } = hook
  const [expandedId, setExpandedId] = useState(null)

  if (loading) {
    return <p className="font-body text-sm text-muted">Chargement des occasions…</p>
  }

  if (error) {
    return (
      <p className="font-body text-sm text-rust">
        Erreur : {error}. Vérifie que le script supabase-conseil.sql a bien été exécuté.
      </p>
    )
  }

  return (
    <div>
      <p className="font-body text-sm text-muted mb-4 max-w-3xl">
        Le bouton « Besoin d'un conseil ? » du site propose ces occasions (Apéro, Repas de fête…).
        Pour chacune, ajoute jusqu'à {MAX_QUESTIONS} questions à choix, puis choisis {MIN_PRODUITS} à{' '}
        {MAX_PRODUITS} produits pour chaque combinaison de réponses. Tout se sauvegarde
        automatiquement quand tu cliques ailleurs. Les questions que les clients posent en texte
        libre sont enregistrées dans Supabase (table conseil_interactions) pour t'aider à enrichir
        ces occasions.
      </p>

      <div className="flex flex-col gap-3 max-w-4xl">
        {occasions.map((occasion) => (
          <OccasionCard
            key={occasion.id}
            occasion={occasion}
            expanded={expandedId === occasion.id}
            onToggle={() => setExpandedId(expandedId === occasion.id ? null : occasion.id)}
            allProducts={allProducts}
            hook={hook}
          />
        ))}
        {occasions.length === 0 && (
          <p className="font-body text-sm text-muted">Aucune occasion pour l'instant.</p>
        )}
      </div>

      <AddForm
        placeholder="Nom de la nouvelle occasion (ex : Apéro)"
        buttonLabel="Ajouter une occasion"
        onAdd={safe((nom) => hook.addOccasion(nom))}
        className="max-w-md mt-4"
      />
    </div>
  )
}
