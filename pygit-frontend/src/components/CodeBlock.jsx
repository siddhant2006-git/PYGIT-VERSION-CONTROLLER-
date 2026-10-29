import { Check, Copy } from 'lucide-react'
import { useRef, useState } from 'react'

// Wraps rehype-highlight's <pre><code>...</code></pre> output with a language
// label and a copy-to-clipboard button — the two things a README code sample
// is missing without a few extra kilobytes of GitHub's own CSS.
export default function CodeBlock({ children, ...props }) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef(null)

  const codeEl = Array.isArray(children) ? children[0] : children
  const className = codeEl?.props?.className || ''
  const language = /language-(\w+)/.exec(className)?.[1]

  function handleCopy() {
    const text = preRef.current?.textContent || ''
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="group relative">
      {language && (
        <span className="absolute right-11 top-2 select-none rounded bg-white/5 px-1.5 py-0.5 text-[11px] font-mono uppercase tracking-wide text-slate-400">
          {language}
        </span>
      )}
      <button
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
      <pre ref={preRef} {...props}>
        {children}
      </pre>
    </div>
  )
}
