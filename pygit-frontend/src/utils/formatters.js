// Display formatting helpers shared across pages/components.

export function timeAgo(timestamp) {
  if (!timestamp) return 'unknown'
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp))
  if (seconds < 5) return 'just now'
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs)
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`
  }
  return `${seconds} second${seconds === 1 ? '' : 's'} ago`
}

export function formatDate(timestamp) {
  if (!timestamp) return ''
  return new Date(Number(timestamp) * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`
}

export function shortHash(hash, length = 7) {
  return hash ? hash.slice(0, length) : ''
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

// Deterministic pastel-ish color from a string, used for avatars/branch chips.
export function colorFromString(str) {
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 55%)`
}

export function fileExtension(path) {
  if (!path) return ''
  const name = path.split('/').pop()
  const idx = name.lastIndexOf('.')
  return idx > 0 ? name.slice(idx + 1).toLowerCase() : ''
}

export function isMarkdown(path) {
  return fileExtension(path) === 'md' || fileExtension(path) === 'markdown'
}

export function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
