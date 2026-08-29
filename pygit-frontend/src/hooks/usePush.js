import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRemotes, push as pushApi } from '../services/api';

/**
 * Shared push logic for every repo page. Loads the repo's remotes so:
 *  - the target remote is visible *before* the user clicks Push, instead of
 *    being silently auto-selected;
 *  - the Push button can be disabled with a clear reason when none exist;
 *  - a repo with multiple remotes gets a picker instead of always guessing.
 *
 * Remotes are re-fetched fresh at push time (not just trusted from the
 * mount-time load) so adding a remote in Settings and immediately pushing
 * works without a page remount, and so a manual `selectedRemote` that no
 * longer exists falls back cleanly instead of erroring.
 */
export function usePush(repoName, branch) {
  const [remotes, setRemotes] = useState(null); // null = loading
  const [selectedRemote, setSelectedRemote] = useState(null); // user override; null = auto (prefer "origin")
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRemotes(null);
    setSelectedRemote(null);
    if (!repoName) return;
    getRemotes(repoName)
      .then((data) => { if (!cancelled) setRemotes(data || []); })
      .catch(() => { if (!cancelled) setRemotes([]); });
    return () => { cancelled = true; };
  }, [repoName]);

  const pickTarget = (list) =>
    (selectedRemote && list.find((r) => r.name === selectedRemote)) ||
    list.find((r) => r.name === 'origin') ||
    list[0] ||
    null;

  // What the button shows *before* pushing — the remote that will actually be used.
  const activeRemote = useMemo(() => pickTarget(remotes || []), [remotes, selectedRemote]);

  const run = useCallback(async () => {
    if (!repoName) return;
    setPushing(true);
    setResult(null);
    try {
      const freshRemotes = await getRemotes(repoName);
      if (!freshRemotes || freshRemotes.length === 0) {
        setResult({ success: false, error: 'No remote configured. Add one in Settings before pushing.' });
        return;
      }
      const target = pickTarget(freshRemotes) || freshRemotes[0];
      const res = await pushApi(repoName, target.name, branch);
      setResult({ ...res, remoteUrl: target.url });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setPushing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoName, branch, selectedRemote]);

  return {
    remotes: remotes || [],
    activeRemote,
    selectRemote: setSelectedRemote,
    pushing,
    result,
    dismiss: () => setResult(null),
    run,
    hasRemote: remotes === null ? true : remotes.length > 0, // avoid disabling before the initial load resolves
    loadingRemotes: remotes === null,
  };
}
