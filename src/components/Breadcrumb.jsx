// items: [{ label, href }] — le dernier élément (page actuelle) n'est pas cliquable.
export default function Breadcrumb({ items }) {
  return (
    <nav className="font-tag text-xs text-muted mb-4 flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-ink/30">›</span>}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-ink font-semibold' : ''}>{item.label}</span>
            ) : (
              <a href={item.href} className="hover:text-ink hover:underline">
                {item.label}
              </a>
            )}
          </span>
        )
      })}
    </nav>
  )
}
