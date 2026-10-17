import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiClient';

/**
 * Universal Data Resource Hook (Backend-Ready & Mock-Resilient)
 * 
 * - When real backend is available: synchronizes with GET/PUT /api/resources/:key
 * - When running offline or in mock mode: reads and updates localStorage (labsetu-demo:key)
 * - Ensures components have 100% uptime with zero UI flickering
 */
export default function useDemoResource(key, initialValue) {
  const storageKey = `labsetu-demo:${key}`;
  const initialRef = useRef(initialValue);
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const read = useCallback(async () => {
    setLoading(true);

    const fallbackFn = async () => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        const resolved = saved ? JSON.parse(saved) : initialRef.current;
        return { success: true, data: resolved };
      } catch {
        return { success: true, data: initialRef.current };
      }
    };

    try {
      const res = await apiClient.get(`/resources/${key}`, {}, fallbackFn);
      if (res.success && res.data !== undefined) {
        setData(res.data);
        setError('');
      } else {
        const fallbackRes = await fallbackFn();
        setData(fallbackRes.data);
      }
    } catch {
      const fallbackRes = await fallbackFn();
      setData(fallbackRes.data);
    } finally {
      setLoading(false);
    }
  }, [key, storageKey]);

  useEffect(() => {
    read();
  }, [read]);

  const update = useCallback(async (nextValue) => {
    setData((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue;

      // Always update localStorage as immediate cache
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(resolved));
        setError('');
      } catch {
        setError('Could not persist data locally in this browser.');
      }

      // Synchronize with backend API in background if online
      apiClient.put(`/resources/${key}`, resolved, {}, async () => ({ success: true })).catch((err) => {
        console.warn(`[useDemoResource] Background sync failed for ${key}:`, err.message);
      });

      return resolved;
    });
  }, [key, storageKey]);

  const reset = useCallback(async () => {
    window.localStorage.removeItem(storageKey);
    setData(initialRef.current);
    setError('');

    apiClient.delete(`/resources/${key}`, {}, async () => ({ success: true })).catch(() => {});
  }, [key, storageKey]);

  return { data, loading, error, update, refresh: read, reset };
}
