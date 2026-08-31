import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copy helper with a self-resetting "copied" flag and a fallback for browsers
 * (or non-HTTPS origins) where navigator.clipboard is unavailable — the raw
 * navigator.clipboard.writeText call used by CommitCard silently did nothing
 * there, so the button appeared to work but copied nothing.
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text) => {
    if (!text) return false;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Fallback for insecure origins / older browsers.
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      document.body.removeChild(el);
    }

    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetAfterMs);
    }
    return ok;
  }, [resetAfterMs]);

  return { copied, copy };
}
