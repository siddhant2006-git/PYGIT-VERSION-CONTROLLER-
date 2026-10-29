import hljs from 'highlight.js'
import { Check, Copy, FileText, GitCommitHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getBlob } from '../services/api'
import { fileExtension, isMarkdown, shortHash, timeAgo } from '../utils/formatters'
import ReadmeViewer from './ReadmeViewer'
import { PageSpinner } from './Spinner'

const LANGUAGE_BY_EXT = {
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  sh: 'bash',
  bash: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  html: 'xml',
  css: 'css',
  toml: 'ini',
  cfg: 'ini',
  gitignore: 'plaintext',
}

function highlight(code, ext) {
  const language = LANGUAGE_BY_EXT[ext]
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return hljs.escapeHTML ? hljs.escapeHTML(code) : code
  }
}

function PlainCodeViewer({ content, ext }) {
  const [copied, setCopied] = useState(false)
  const lines = useMemo(() => content.split('\n'), [content])
  const html = useMemo(() => highlight(content, ext), [content, ext])

  function handleCopy() {
    navigator.clipboard?.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-[#0d1117]">
      <button
        onClick={handleCopy}
        aria-label="Copy file contents"
        className="absolute right-3 top-3 z-10 rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
      <div className="flex max-h-[75vh] overflow-auto text-[13px] leading-6">
        <div className="select-none border-r border-white/5 px-3 py-4 text-right font-mono text-slate-500/70">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 px-4 py-4">
          <code className="hljs font-mono" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  )
}

export default function FileViewer({ repoName, branch, path }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!repoName || !branch || !path) return
    let active = true
    setLoading(true)
    getBlob(repoName, branch, path).then((data) => {
      if (active) {
        setFile(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [repoName, branch, path])

  if (loading || !file) return <PageSpinner label="Loading file..." />

  if (isMarkdown(path)) {
    return (
      <ReadmeViewer
        content={file.content}
        fileName={file.name}
        meta={file.last_commit ? { sha: shortHash(file.last_commit.sha), message: file.last_commit.message } : null}
      />
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
          <FileText size={15} />
          {file.name}
        </span>
        {file.last_commit && (
          <span className="inline-flex items-center gap-1.5" title={file.last_commit.message}>
            <GitCommitHorizontal size={13} />
            <span className="font-mono">{shortHash(file.last_commit.sha)}</span>
            <span className="max-w-xs truncate">{file.last_commit.message}</span>
            <span>&middot; {timeAgo(file.last_commit.date)}</span>
          </span>
        )}
      </div>
      <PlainCodeViewer content={file.content} ext={fileExtension(path)} />
    </div>
  )
}
