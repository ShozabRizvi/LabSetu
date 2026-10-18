import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiClient';

/**
 * Universal Data Resource Hook (Backend-Ready & Mock-Resilient)
 *
 * Guarantees strict array safety:
 * - If initialData is an array (or default []), data is ALWAYS an Array, never null/undefined.
 * - Normalizes API responses (response, response.data, response.records).
 * - Implements graceful local cache persistence and optimistic updates.
 */
export function useDemoResource(resourceKey, initialData = []) {
  const storageKey = `labsetu-demo:${resourceKey}`;
  const initialRef = useRef(initialData);
  const isArrayExpected = Array.isArray(initialData);

  // Synchronous safe initialization
  const [data, setData] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null && saved !== undefined) {
        const parsed = JSON.parse(saved);
        if (isArrayExpected) {
          if (Array.isArray(parsed)) return parsed;
          if (parsed && Array.isArray(parsed.data)) return parsed.data;
          if (parsed && Array.isArray(parsed.records)) return parsed.records;
          return Array.isArray(initialData) ? initialData : [];
        }
        return parsed || initialData;
      }
    } catch {
      // JSON parse error — ignore
    }
    return isArrayExpected ? (Array.isArray(initialData) ? initialData : []) : initialData;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistLocal = useCallback((val) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(val));
    } catch {
      // Quota exceeded
    }
  }, [storageKey]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/resources/${resourceKey}`);
      
      let safeData;
      if (isArrayExpected) {
        const extracted = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.records)
          ? response.records
          : [];

        // If server returned an empty array but we have initial/stored records, keep rich data
        if (extracted.length === 0 && Array.isArray(initialRef.current) && initialRef.current.length > 0) {
          try {
            const saved = window.localStorage.getItem(storageKey);
            const parsed = saved ? JSON.parse(saved) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
              safeData = parsed;
            } else {
              safeData = initialRef.current;
            }
          } catch {
            safeData = initialRef.current;
          }
        } else {
          safeData = extracted;
        }
      } else {
        safeData = response?.data || response?.records || response || initialRef.current || {};
      }

      setData(safeData);
      persistLocal(safeData);
      setError(null);
    } catch (err) {
      console.warn(`Resource fetch fallback for ${resourceKey}:`, err);
      const fallbackVal = isArrayExpected
        ? (Array.isArray(initialRef.current) ? initialRef.current : [])
        : (initialRef.current || {});
      setData(fallbackVal);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [resourceKey, isArrayExpected, persistLocal, storageKey]);

  useEffect(() => {
    let isMounted = true;
    fetchData();
    return () => { isMounted = false; };
  }, [fetchData]);

  // Synchronous optimistic updater with background backend sync
  const update = useCallback(async (nextValue) => {
    setData((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      persistLocal(resolved);
      apiClient
        .post(`/resources/${resourceKey}`, resolved, {}, async () => ({ success: true }))
        .catch(() => {});
      return resolved;
    });
  }, [resourceKey, persistLocal]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
    const defaultVal = isArrayExpected
      ? (Array.isArray(initialRef.current) ? initialRef.current : [])
      : initialRef.current;
    setData(defaultVal);
    apiClient.delete(`/resources/${resourceKey}`, {}, async () => ({ success: true })).catch(() => {});
  }, [resourceKey, storageKey, isArrayExpected]);

  return {
    data,
    setData: update,
    update,
    loading,
    error,
    refresh: fetchData,
    reset
  };
}

export default useDemoResource;
