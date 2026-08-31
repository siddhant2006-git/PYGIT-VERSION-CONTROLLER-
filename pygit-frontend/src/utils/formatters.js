/** Normalise the backend's timestamps (Unix seconds) or ISO strings to a Date. */
function toDate(dateInput) {
  if (dateInput === null || dateInput === undefined || dateInput === '') return null;
  const date =
    typeof dateInput === 'number'
      ? new Date(dateInput * (dateInput < 10000000000 ? 1000 : 1))
      : new Date(dateInput);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format timestamp into relative time string (e.g. "2 hours ago")
 */
export function formatRelativeTime(dateInput) {
  const date = toDate(dateInput);
  if (!date) return 'N/A';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Clock skew between the browser and the backend can put a fresh commit a
  // few seconds in the future; "in 3 seconds" reads as a bug, so clamp it.
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Full date + time, for the `title` tooltip next to a relative time so the
 * exact moment is still one hover away.
 */
export function formatAbsoluteTime(dateInput) {
  const date = toDate(dateInput);
  if (!date) return '';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate commit SHA hash to short form (first 7 chars)
 */
export function shortSha(hash) {
  if (!hash) return '';
  return hash.substring(0, 7);
}

/**
 * Split "Name <email@example.com>" into its parts so the UI can show the name
 * prominently and keep the address for a tooltip.
 */
export function parseAuthor(author) {
  if (!author) return { name: 'Unknown', email: '' };
  const match = /^\s*(.*?)\s*<([^>]*)>\s*$/.exec(author);
  if (!match) return { name: author.trim(), email: '' };
  return { name: match[1] || match[2], email: match[2] };
}

/**
 * Format bytes to readable size (e.g. "1.2 KB")
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
