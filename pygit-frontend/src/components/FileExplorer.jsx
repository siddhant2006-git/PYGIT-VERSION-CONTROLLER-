import { File, FileCode2, FileText, Folder } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFiles } from '../services/api'
import { fileExtension, formatBytes } from '../utils/formatters'

const CODE_EXTS = new Set(['py', 'js', 'jsx', 'ts', 'tsx', 'json', 'toml', 'cfg', 'yml', 'yaml', 'sh'])

function FileIcon({ name, type }) {
  if (type === 'dir') return <Folder size={16} className="text-accent-500 fill-accent-100 dark:fill-accent-900/40" />
  const ext = fileExtension(name)
  if (ext === 'md' || ext === 'markdown') return <FileText size={16} className="text-slate-400" />
  if (CODE_EXTS.has(ext)) return <FileCode2 size={16} className="text-slate-400" />
  return <File size={16} className="text-slate-400" />
}

export default function FileExplorer({ repoName, branch, path, onNavigate, onSelectFile, selectedPath }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!repoName || !branch) return
    let active = true
    setLoading(true)
    getFiles(repoName, { branch, path }).then((data) => {
      if (active) {
        setEntries(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [repoName, branch, path])

  const crumbs = path ? path.split('/').filter(Boolean) : []

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden">
      <div className="flex items-center gap-1 border-b border-border-light dark:border-border-dark px-3 py-2 text-sm">
        <button
          onClick={() => onNavigate('')}
          className="text-slate-500 hover:text-accent-600 dark:text-slate-400 dark:hover:text-accent-400 font-medium"
        >
          {repoName}
        </button>
        {crumbs.map((part, i) => {
          const crumbPath = crumbs.slice(0, i + 1).join('/')
          return (
            <span key={crumbPath} className="flex items-center gap-1 text-slate-400">
              /
              <button
                onClick={() => onNavigate(crumbPath)}
                className="text-slate-600 hover:text-accent-600 dark:text-slate-300 dark:hover:text-accent-400 font-medium"
              >
                {part}
              </button>
            </span>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-full rounded" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-4 text-sm text-slate-400">This folder is empty.</p>
      ) : (
        <ul className="divide-y divide-border-light dark:divide-border-dark">
          {entries.map((entry) => {
            const isActive = entry.type === 'file' && entry.path === selectedPath
            return (
              <li key={entry.path}>
                <button
                  onClick={() => (entry.type === 'dir' ? onNavigate(entry.path) : onSelectFile(entry.path))}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    isActive ? 'bg-accent-50 dark:bg-accent-900/20' : ''
                  }`}
                >
                  <FileIcon name={entry.name} type={entry.type} />
                  <span className={`truncate ${isActive ? 'text-accent-700 dark:text-accent-300 font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                    {entry.name}
                  </span>
                  {entry.type === 'file' && entry.size != null && (
                    <span className="ml-auto shrink-0 text-xs text-slate-400">{formatBytes(entry.size)}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
