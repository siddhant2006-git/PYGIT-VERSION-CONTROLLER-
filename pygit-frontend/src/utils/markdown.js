import GithubSlugger from 'github-slugger'

// Strip common inline markdown syntax so heading text used for the TOC and
// for slug generation matches what the reader actually sees / what
// rehype-slug (which slugs rendered text content) produces.
function stripInlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links
    .replace(/[`*_~]+/g, '')
    .trim()
}

// Extract h1-h3 headings from raw markdown (skipping fenced code blocks) for
// the table-of-contents sidebar, with GitHub-compatible slugs.
export function extractHeadings(markdown = '') {
  const slugger = new GithubSlugger()
  const headings = []
  let inFence = false

  for (const rawLine of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(rawLine)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(rawLine)
    if (match) {
      const depth = match[1].length
      const text = stripInlineMarkdown(match[2])
      if (text) headings.push({ depth, text, id: slugger.slug(text) })
    }
  }
  return headings
}

export function estimateReadingStats(markdown = '') {
  const words = markdown
    .replace(/```[\s\S]*?```/g, '')
    .split(/\s+/)
    .filter(Boolean).length
  return { words, minutes: Math.max(1, Math.round(words / 200)) }
}
