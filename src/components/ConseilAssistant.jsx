import { useEffect, useMemo, useRef, useState } from 'react'
import { useConseil } from '../context/ConseilContext'
import { usePriceMode } from '../context/PriceModeContext'
import { useOccasions } from '../hooks/useOccasions'
import { useProductsByIds } from '../hooks/useProductsByIds'
import { useConseilInteractions } from '../hooks/useConseilInteractions'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { getQuestionsPosees, findSelection } from '../lib/occasions'
import ProductCard from './ProductCard'

const QUESTION_MAX = 300

function ChoiceButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 text-left border border-ink/30 bg-paper px-4 py-3.5 font-body text-base hover:border-forest hover:bg-stone transition-colors"
    >
      <span>{children}</span>
      <span className="font-tag text-sm text-forest shrink-0">→</span>
    </button>
  )
}

function ProductGrid({ ids }) {
  const { products, loading } = useProductsByIds(ids)
  const { isPickup, discountPercent, setMode } = usePriceMode()

  if (loading) {
    return <p className="font-body text-sm text-muted">Chargement des produits…</p>
  }
  if (products.length === 0) return null

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <p className="font-tag text-[11px] text-muted mt-3">
        Prix affichés en mode {isPickup ? 'Retrait' : 'Livraison'}.{' '}
        <button
          onClick={() => setMode(isPickup ? 'livraison' : 'retrait')}
          className="underline hover:text-ink"
        >
          {isPickup
            ? 'Voir les prix livraison'
            : `Voir les prix retrait${discountPercent > 0 ? ` (-${discountPercent}%)` : ''}`}
        </button>
      </p>
    </div>
  )
}

function ConseilDialog({ onClose }) {
  const { occasions, loading, error } = useOccasions()
  const { mode } = usePriceMode()
  const { settings } = useSiteSettings()
  const { logQuestionnaire, askQuestion } = useConseilInteractions()
  const dialogRef = useRef(null)

  // Un identifiant par ouverture de l'assistant : il relie le parcours au
  // questionnaire et la question libre éventuelle dans le journal.
  const [sessionId] = useState(() => crypto.randomUUID())

  const [view, setView] = useState('occasion') // 'occasion' | 'question' | 'resultat' | 'libre'
  const [previousView, setPreviousView] = useState('occasion')
  const [occasion, setOccasion] = useState(null)
  const [answers, setAnswers] = useState([])

  const [question, setQuestion] = useState('')
  const [aiState, setAiState] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [aiResult, setAiResult] = useState(null)

  const telephone = settings?.contact_telephone || '02 98 20 50 43'

  // Une occasion sans aucun produit renseigné mènerait à un cul-de-sac : on la masque.
  const visibleOccasions = useMemo(
    () => occasions.filter((o) => o.actif && o.selections.some((s) => s.produits.length > 0)),
    [occasions]
  )

  const posees = occasion ? getQuestionsPosees(occasion) : []
  const step = answers.length // index de la question en cours
  const currentQuestion = view === 'question' ? posees[step] : null

  useEffect(() => {
    dialogRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  // Les réponses sont rangées par question posée ; la sélection se retrouve
  // avec la réponse à la question d'ordre 0 et celle d'ordre 1.
  const selectionFor = (occ, chosen) => {
    const par = { 0: null, 1: null }
    getQuestionsPosees(occ).forEach((q, i) => {
      par[q.ordre] = chosen[i]?.id ?? null
    })
    return findSelection(occ, par[0], par[1])
  }

  const showResult = (occ, chosen) => {
    const selection = selectionFor(occ, chosen)
    logQuestionnaire({
      sessionId,
      mode,
      occasion: occ,
      reponses: chosen.map((a, i) => ({
        question: getQuestionsPosees(occ)[i].libelle,
        reponse: a.libelle,
      })),
      selection,
    })
    setView('resultat')
  }

  const chooseOccasion = (occ) => {
    setOccasion(occ)
    setAnswers([])
    if (getQuestionsPosees(occ).length === 0) {
      showResult(occ, [])
    } else {
      setView('question')
    }
  }

  const chooseAnswer = (reponse) => {
    const next = [...answers, reponse]
    setAnswers(next)
    if (next.length < posees.length) {
      setView('question')
    } else {
      showResult(occasion, next)
    }
  }

  const goBack = () => {
    if (view === 'libre') {
      setView(previousView)
    } else if (view === 'resultat') {
      if (posees.length === 0) {
        setOccasion(null)
        setView('occasion')
      } else {
        setAnswers(answers.slice(0, -1))
        setView('question')
      }
    } else if (view === 'question') {
      if (step === 0) {
        setOccasion(null)
        setView('occasion')
      } else {
        setAnswers(answers.slice(0, -1))
      }
    }
  }

  const restart = () => {
    setOccasion(null)
    setAnswers([])
    setView('occasion')
  }

  const openLibre = () => {
    if (view !== 'libre') setPreviousView(view)
    setView('libre')
  }

  const sendQuestion = async (e) => {
    e.preventDefault()
    const text = question.trim()
    if (text.length < 2 || aiState === 'loading') return
    setAiState('loading')
    const result = await askQuestion({
      question: text,
      sessionId,
      mode,
      occasionNom: occasion?.nom ?? null,
      contexte: answers.map((a, i) => ({ question: posees[i].libelle, reponse: a.libelle })),
    })
    setAiResult(result)
    setAiState(result.ok ? 'done' : 'error')
  }

  const selection = view === 'resultat' && occasion ? selectionFor(occasion, answers) : null
  const resultIds = selection ? selection.produits.map((p) => p.produit_id) : []

  const stepLabel = view === 'question' ? `Question ${step + 1} sur ${posees.length}` : null

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 flex items-stretch sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Besoin d'un conseil ?"
        className="bg-paper w-full sm:max-w-3xl sm:max-h-[90vh] flex flex-col border border-ink/20 focus:outline-none"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-ink text-paper shrink-0">
          <h2 className="font-display text-2xl tracking-wide">Besoin d'un conseil ?</h2>
          <button
            onClick={onClose}
            className="font-tag text-xs uppercase text-stone/80 hover:text-paper"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {view !== 'occasion' && (
            <button
              onClick={goBack}
              className="font-tag text-xs uppercase font-semibold text-muted hover:text-ink mb-3"
            >
              ← Retour
            </button>
          )}

          {stepLabel && (
            <p className="font-tag text-[11px] uppercase tracking-widest text-muted mb-1">
              {stepLabel}
            </p>
          )}

          {view === 'occasion' && (
            <>
              <h3 className="font-display text-3xl text-ink mb-4">Qu'est-ce qui t'amène ?</h3>
              {loading && <p className="font-body text-sm text-muted">Chargement…</p>}
              {error && (
                <p className="font-body text-sm text-rust">
                  Le questionnaire n'est pas disponible pour le moment.
                </p>
              )}
              {!loading && !error && visibleOccasions.length === 0 && (
                <p className="font-body text-sm text-muted">
                  Pas encore de questionnaire, mais tu peux nous poser ta question juste en dessous.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {visibleOccasions.map((occ) => (
                  <ChoiceButton key={occ.id} onClick={() => chooseOccasion(occ)}>
                    {occ.nom}
                  </ChoiceButton>
                ))}
              </div>
            </>
          )}

          {view === 'question' && currentQuestion && (
            <>
              <p className="font-tag text-xs uppercase font-semibold text-forest mb-1">
                {occasion.nom}
              </p>
              <h3 className="font-display text-3xl text-ink mb-4">{currentQuestion.libelle}</h3>
              <div className="flex flex-col gap-2">
                {currentQuestion.reponses.map((r) => (
                  <ChoiceButton key={r.id} onClick={() => chooseAnswer(r)}>
                    {r.libelle}
                  </ChoiceButton>
                ))}
              </div>
            </>
          )}

          {view === 'resultat' && occasion && (
            <>
              <p className="font-tag text-xs uppercase font-semibold text-forest mb-1">
                {[occasion.nom, ...answers.map((a) => a.libelle)].join(' · ')}
              </p>
              {resultIds.length > 0 ? (
                <>
                  <h3 className="font-display text-3xl text-ink mb-2">Notre sélection pour toi</h3>
                  {selection.intro && (
                    <p className="font-body text-sm text-ink mb-4 max-w-xl">{selection.intro}</p>
                  )}
                  <ProductGrid ids={resultIds} />
                </>
              ) : (
                <>
                  <h3 className="font-display text-3xl text-ink mb-2">
                    Pas encore de sélection pour ce choix
                  </h3>
                  <p className="font-body text-sm text-ink mb-4 max-w-xl">
                    On n'a pas de sélection toute prête pour cette combinaison. Pose-nous ta
                    question, on te répond.
                  </p>
                  <button
                    onClick={openLibre}
                    className="bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-forest"
                  >
                    Poser ma question
                  </button>
                </>
              )}
              <div className="mt-5">
                <button
                  onClick={restart}
                  className="font-tag text-xs uppercase font-semibold text-forest hover:underline"
                >
                  Recommencer
                </button>
              </div>
            </>
          )}

          {view === 'libre' && (
            <>
              <h3 className="font-display text-3xl text-ink mb-1">Pose ta question</h3>
              <p className="font-body text-sm text-muted mb-4 max-w-xl">
                Dis-nous ce que tu cherches, on te propose des produits du site. Réponse
                automatique : vérifie toujours sur la fiche produit.
              </p>

              {aiState !== 'done' && (
                <form onSubmit={sendQuestion} className="mb-4">
                  <textarea
                    rows={3}
                    maxLength={QUESTION_MAX}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={aiState === 'loading'}
                    placeholder="Ex : un dessert pas trop sucré pour 8 personnes, sans lactose si possible"
                    className="w-full border border-ink/30 p-2.5 font-body text-sm bg-paper focus:border-forest focus:outline-none disabled:opacity-60"
                  />
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="font-tag text-[11px] text-muted">
                      {question.length}/{QUESTION_MAX}
                    </span>
                    <button
                      type="submit"
                      disabled={question.trim().length < 2 || aiState === 'loading'}
                      className="bg-ink text-paper font-tag text-xs font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-forest disabled:bg-muted disabled:cursor-not-allowed"
                    >
                      {aiState === 'loading' ? 'Je cherche dans le catalogue…' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              )}

              {aiState === 'error' && aiResult && (
                <div className="border border-rust/40 bg-rust/5 p-3 mb-4">
                  <p className="font-body text-sm text-ink">{aiResult.message}</p>
                  <p className="font-body text-sm text-ink mt-1">
                    Le dépôt :{' '}
                    <a href={`tel:${telephone.replace(/\s/g, '')}`} className="underline">
                      {telephone}
                    </a>
                    .
                  </p>
                </div>
              )}

              {aiState === 'done' && aiResult?.ok && (
                <div>
                  <p className="font-body text-base text-ink mb-4 max-w-xl whitespace-pre-line">
                    {aiResult.message}
                  </p>
                  <ProductGrid ids={aiResult.produit_ids} />
                  <button
                    onClick={() => {
                      setQuestion('')
                      setAiResult(null)
                      setAiState('idle')
                    }}
                    className="mt-5 font-tag text-xs uppercase font-semibold text-forest hover:underline"
                  >
                    Poser une autre question
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {view !== 'libre' && (
          <div className="border-t border-ink/15 px-4 py-3 shrink-0">
            <p className="font-body text-xs text-muted">
              Aucune de ces réponses ne te convient ?{' '}
              <button onClick={openLibre} className="underline hover:text-ink">
                Pose ta question
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConseilAssistant() {
  const { isOpen, close } = useConseil()
  // Le contenu n'existe que pendant l'ouverture : chaque ouverture repart de
  // zéro et recharge les occasions à jour, sans rien coûter aux autres pages.
  return isOpen ? <ConseilDialog onClose={close} /> : null
}
