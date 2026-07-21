import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic data-fetching hook with loading/error/refresh support.
 *
 * @param {Function} fetchFn  — async function that returns data
 * @param  {...any} args      — arguments forwarded to fetchFn
 * @returns {{ data: any, loading: boolean, error: Error|null, refresh: Function }}
 */
export function useReportsData(fetchFn, ...args) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        // Preserve the original error — includes status, statusText, body from reportsApi
        setError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, ...args]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { data, loading, error, refresh: load };
}
