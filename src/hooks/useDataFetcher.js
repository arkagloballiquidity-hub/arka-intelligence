// ============================================================
//  ARKA — useDataFetcher hook
//  Maneja fetch, caché en memoria, auto-refresh y estado
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';

// Caché en memoria (sobrevive re-renders, no persiste entre recargas)
const cache = new Map();

export function useDataFetcher(key, fetchFn, { ttl = 60000, deps = [] } = {}) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (force = false) => {
    // Revisa caché
    const cached = cache.get(key);
    if (!force && cached && Date.now() - cached.ts < ttl) {
      setData(cached.data);
      setLastUpdate(cached.ts);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (!mountedRef.current) return;
      cache.set(key, { data: result, ts: Date.now() });
      setData(result);
      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Fetch failed');
      // Mantiene datos anteriores si los hay
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [key, ttl, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    load();

    // Auto-refresh
    timerRef.current = setInterval(() => load(true), ttl);

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [load, ttl]);

  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, error, lastUpdate, refresh };
}

// Formatea timestamp a "last updated X ago"
export function formatLastUpdate(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
