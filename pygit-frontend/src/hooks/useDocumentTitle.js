import { useEffect } from 'react';

const SUFFIX = 'PyGit';

/**
 * Keeps the browser tab title in sync with the current page. Every route used
 * to render under the same static title, which makes tab-switching and browser
 * history entries indistinguishable.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX;
    return () => { document.title = previous; };
  }, [title]);
}
