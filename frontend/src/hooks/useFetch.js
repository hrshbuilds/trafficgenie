import { useState, useEffect } from 'react';

/**
 * Generic hook for fetching data
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} dependencies - Dependency array to refetch
 * @param {Object} options - { retry: 3, cacheTime: 5m }
 */
export function useFetch(fetchFn, dependencies = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { retry = 1, cacheTime = null } = options;

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchFn();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (attempts < retry) {
          attempts++;
          setTimeout(load, 1000 * Math.pow(2, attempts)); // Exponential backoff
        } else if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  const refetch = async () => {
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
