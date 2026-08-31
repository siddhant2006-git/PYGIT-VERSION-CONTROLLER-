/**
 * Repository names become directory names under the backend's REPOS_DIR, so
 * the rules below are the ones the filesystem (and the API's path routing)
 * actually care about. Validating here turns a 400 from the server into
 * inline feedback while the user is still typing.
 *
 * Returns an error string, or '' when the name is usable.
 */
export function validateRepoName(name) {
  const value = (name || '').trim();
  if (!value) return 'Repository name is required.';
  if (value.length > 100) return 'Repository name must be 100 characters or fewer.';
  if (value === '.' || value === '..') return 'Repository name cannot be "." or "..".';
  if (value.startsWith('.')) return 'Repository name cannot start with a dot.';
  if (/[/\\]/.test(value)) return 'Repository name cannot contain slashes.';
  if (/\s/.test(value)) return 'Repository name cannot contain spaces — try hyphens instead.';
  if (!/^[A-Za-z0-9._-]+$/.test(value)) {
    return 'Use only letters, numbers, dots, hyphens and underscores.';
  }
  return '';
}

/**
 * Branch names follow the same shape as git's, minus the rules that only
 * matter to refs on disk (no leading/trailing slash, no "..", no spaces).
 */
export function validateBranchName(name) {
  const value = (name || '').trim();
  if (!value) return 'Branch name is required.';
  if (/\s/.test(value)) return 'Branch name cannot contain spaces.';
  if (value.includes('..')) return 'Branch name cannot contain "..".';
  if (value.startsWith('/') || value.endsWith('/')) return 'Branch name cannot start or end with a slash.';
  if (value.endsWith('.lock')) return 'Branch name cannot end with ".lock".';
  if (/[~^:?*[\]\\]/.test(value)) return 'Branch name cannot contain ~ ^ : ? * [ ] or backslashes.';
  return '';
}
