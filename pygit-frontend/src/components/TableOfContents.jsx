import { List } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function TableOfContents({ headings, containerRef }) {
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (!containerRef.current || headings.length === 0) return
    const elements = headings
      .map((h) => containerRef.current.querySelector(`#${CSS.escape(h.id)}`))
      .filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 1] }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings, containerRef])

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto xl:block">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <List size={13} />
        On this page
      </p>
      <ul className="space-y-1 border-l border-border-light dark:border-border-dark text-sm">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.depth - 1) * 0.75 + 0.75}rem` }}>
            <a
              href={`#${h.id}`}
              className={`block border-l-2 -ml-px py-0.5 transition-colors ${
                activeId === h.id
                  ? 'border-accent-500 text-accent-600 dark:text-accent-400 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
