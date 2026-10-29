import { Check, ChevronDown, GitBranch } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function BranchSelector({ branches, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-accent-300 dark:hover:border-accent-700 disabled:opacity-50 transition-colors"
      >
        <GitBranch size={14} className="text-slate-400" />
        {value || 'select branch'}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1.5 w-56 animate-pop-in rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-1 shadow-xl">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Switch branches</p>
          <ul className="max-h-60 overflow-y-auto">
            {branches.map((b) => (
              <li key={b.name}>
                <button
                  onClick={() => {
                    onChange(b.name)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="truncate">{b.name}</span>
                  {b.name === value && <Check size={14} className="text-accent-600 dark:text-accent-400 shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
