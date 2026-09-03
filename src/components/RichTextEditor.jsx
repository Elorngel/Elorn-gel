import { useRef, useEffect } from 'react'

// Ne garde que les balises de mise en forme simples au collage (gras,
// italique, listes...), et retire tout le reste (styles Word, couleurs,
// polices) pour éviter d'importer un fouillis de mise en forme parasite.
function sanitizeHtml(html) {
  const allowed = ['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'P', 'UL', 'OL', 'LI']
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const clean = (node) => {
    ;[...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        if (!allowed.includes(child.tagName)) {
          while (child.firstChild) node.insertBefore(child.firstChild, child)
          node.removeChild(child)
        } else {
          child.removeAttribute('style')
          child.removeAttribute('class')
          clean(child)
        }
      }
    })
  }

  clean(doc.body)
  return doc.body.innerHTML
}

export default function RichTextEditor({ value, onChange, placeholder, minHeightRem = 6 }) {
  const ref = useRef(null)

  // On remplit le contenu une fois que le champ existe vraiment dans la
  // page (après le premier rendu), sinon la valeur de départ est ignorée.
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exec = (command) => {
    ref.current?.focus()
    document.execCommand(command, false, null)
    onChange(ref.current.innerHTML)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    const clean = html ? sanitizeHtml(html) : text.replace(/\n/g, '<br>')
    document.execCommand('insertHTML', false, clean)
    onChange(ref.current.innerHTML)
  }

  return (
    <div className="border border-ink/20 mb-4">
      <div className="flex gap-1 border-b border-ink/15 p-1 bg-stone">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="w-7 h-7 font-bold text-sm hover:bg-paper"
          title="Gras"
        >
          G
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="w-7 h-7 italic text-sm hover:bg-paper"
          title="Italique"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="w-7 h-7 text-sm hover:bg-paper"
          title="Liste à puces"
        >
          •
        </button>
      </div>
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          onPaste={handlePaste}
          className="p-2 font-body text-sm focus:outline-none relative z-10"
          style={{ minHeight: `${minHeightRem}rem` }}
        />
        {!value && (
          <p className="absolute top-2 left-2 font-body text-sm text-muted pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  )
}
