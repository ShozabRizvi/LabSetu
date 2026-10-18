import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiClient';

/**
 * Universal Data Resource Hook  (Backend-Ready & Mock-Resilient)
 *
 * Priority chain on mount:
 *   1. Synchronous: hydrate from localStorage (zero-flicker, refresh-safe)
 *   2. Async:       GET /api/resources/:key  → overwrite state + refresh cache
 *   3. Fallback:    any network/server error  → keep localStorage value silently
 *
 * On update():
 *   1. Optimistic local state update (instant UI response)
 *   2. localStorage write (survives refresh)
 *   3. Background POST /api/resources/:key  → Supabase persistence
 *   4. Any POST error is swallowed silently so the UI never crashes
 *
 * No DevTools 404/503 spam: all fetch errors are caught and suppressed.
 */
export default function useDemoResource(key, initialValue) {
  const storageKey  = `labsetu-demo:${key}`;
  const initialRef  = useRef(initialValue);
  const isMounted   = useRef(true);

  // ── 1. Synchronous init from localStorage ──────────────────────────────────
  const [data, setData] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null && saved !== undefined) return JSON.parse(saved);
    } catch {
      // corrupted JSON — ignore
    }
    return initialValue;
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState('');

  // ── Local-storage helper ───────────────────────────────────────────────────
  const persistLocal = useCallback((value) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Quota exceeded — not critical
    }
  }, [storageKey]);

  const readLocal = useCallback(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialRef.current;
    } catch {
      return initialRef.current;
    }
  }, [storageKey]);

  // ── 2. Async hydration from backend ───────────────────────────────────────
  const read = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);

    // Always-succeed local fallback used by apiClient if network fails
    const localFallback = async () => ({ success: true, data: readLocal() });

    try {
      const res = await apiClient.get(`/resources/${key}`, {}, localFallback);

      if (!isMounted.current) return;

      if (res?.success && res.data !== undefined) {
        // Use backend data only when it contains real rows / non-empty content.
        // If the server returns an empty array but localStorage has rich data
        // (e.g. pending first-run sync), keep the local data to avoid wiping UI.
        const backendData = res.data;
        const isEmpty     = Array.isArray(backendData) && backendData.length === 0;
        const localData   = readLocal();
        const hasLocalData = Array.isArray(localData)
          ? localData.length > 0
          : localData !== null && localData !== undefined;

        const resolved = (isEmpty && hasLocalData) ? localData : backendData;
        setData(resolved);
        setError('');
        persistLocal(resolved);
      }
    } catch {
      // Network completely unreachable — stay on localStorage value, no error shown
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [key, readLocal, persistLocal]);

  useEffect(() => {
    isMounted.current = true;
    read();
    return () => { isMounted.current = false; };
  }, [read]);

  // ── 3. Optimistic update + background Supabase sync ───────────────────────
  const update = useCallback(async (nextValue) => {
    setData((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;

      // Immediate localStorage write
      persistLocal(resolved);
      setError('');

      // Background POST to /api/resources/:key (Supabase via backend)
      // Errors are silently swallowed — localStorage is the source of truth
      // until the backend confirms.
      apiClient
        .post(`/resources/${key}`, resolved, {}, async () => ({ success: true }))
        .catch(() => { /* intentionally silent */ });

      return resolved;
    });
  }, [key, persistLocal]);

  // ── 4. Reset to initial value ─────────────────────────────────────────────
  const reset = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    setData(initialRef.current);
    setError('');

    // Best-effort DELETE to backend; ignore response
    apiClient
      .delete(`/resources/${key}`, {}, async () => ({ success: true }))
      .catch(() => { /* intentionally silent */ });
  }, [key, storageKey]);

  return { data, loading, error, update, refresh: read, reset };
}
