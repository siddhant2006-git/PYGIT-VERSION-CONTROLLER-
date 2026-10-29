import { BookText, Clock } from 'lucide-react'
import { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { extractHeadings, estimateReadingStats } from '../utils/markdown'
import CodeBlock from './CodeBlock'
import TableOfContents from './TableOfContents'

function Heading(level) {
  const Tag = `h${level}`
  // eslint-disable-next-line react/display-name
  return ({ id, children }) => (
    <Tag id={id}>
      {children}
      {id && (
        <a href={`#${id}`} className="heading-anchor" aria-label="Link to this section">
          #
        </a>
      )}
    </Tag>
  )
}

const markdownComponents = {
  h1: Heading(1),
  h2: Heading(2),
  h3: Heading(3),
  h4: Heading(4),
  a: ({ href = '', children, ...props }) => {
    const external = /^https?:\/\//.test(href)
    return (
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} {...props}>
        {children}
      </a>
    )
  },
  img: ({ alt, ...props }) => <img alt={alt} loading="lazy" decoding="async" {...props} />,
  pre: CodeBlock,
  table: ({ children }) => <div className="overflow-x-auto">{children}</div>,
}

/**
 * Renders a markdown document (README.md or any .md/.markdown file) with:
 * GFM (tables/task-lists/strikethrough), syntax-highlighted + copyable code
 * blocks, anchored headings, a scroll-spy table of contents, and a reading
 * time estimate.
 */
export default function ReadmeViewer({ content, fileName = 'README.md', meta }) {
  const containerRef = useRef(null)
  const headings = useMemo(() => extractHeadings(content), [content])
  const stats = useMemo(() => estimateReadingStats(content), [content])

  return (
    <div className="flex gap-6 animate-fade-in">
      <div className="min-w-0 flex-1 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-light dark:border-border-dark px-4 py-3">
          <BookText size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{fileName}</span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock size={12} />
            {stats.minutes} min read &middot; {stats.words.toLocaleString()} words
          </span>
          {meta?.message && (
            <span className="ml-auto truncate text-xs text-slate-400" title={meta.message}>
              Last commit: <span className="font-mono">{meta.sha}</span> &mdash; {meta.message}
            </span>
          )}
        </div>

        <div ref={containerRef} className="md-body px-5 py-5 sm:px-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSlug, [rehypeHighlight, { ignoreMissing: true }]]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      <TableOfContents headings={headings} containerRef={containerRef} />
    </div>
  )
}
