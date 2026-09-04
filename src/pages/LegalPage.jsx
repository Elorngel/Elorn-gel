import Header from '../components/Header'

export default function LegalPage({ title, content }) {
  return (
    <div className="min-h-screen bg-stone">
      <Header activeCategory={null} />
      <div className="max-w-3xl mx-auto px-5 py-8">
        <a href="#" className="font-tag text-xs uppercase text-muted hover:text-ink">
          ‹ Retour au catalogue
        </a>
        <h1 className="font-display text-4xl text-ink mt-3 mb-6">{title}</h1>
        <div
          className="bg-paper border border-ink/15 p-6 font-body text-sm text-ink leading-relaxed legal-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
}
