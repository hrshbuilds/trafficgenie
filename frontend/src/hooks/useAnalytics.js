import { useState, useEffect, useCallback } from 'react';
import * as analyticsApi from '../services/api/analyticsApi';

/**
 * Hook to fetch analytics data
 */
export function useAnalytics(timeframe = 'week') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (isMountedRef = { current: true }) => {
    try {
      setLoading(true);
      setError(null);
      const analytics = await analyticsApi.fetchAnalytics(timeframe);
      if (isMountedRef.current) setData(analytics);
    } catch (err) {
      if (isMountedRef.current) setError(err.message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [timeframe]);

  const refetch = useCallback(async () => {
    await fetchData({ current: true });
  }, [fetchData]);

  useEffect(() => {
    const isMountedRef = { current: true };

    async function fetchInitialData() {
      try {
        await fetchData(isMountedRef);
      } catch {
        // handled inside fetchData
      }
    }

    fetchInitialData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return { data, analytics: data, loading, error, refetch };
}

/**
 * Hook to fetch top statistics
 */
export function useTopStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const data = await analyticsApi.fetchTopStats();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, loading, error };
}

/**
 * Hook to fetch ward statistics
 */
export function useWardStats() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const data = await analyticsApi.fetchWardStats();
        if (isMounted) setWards(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { wards, loading, error };
}

/**
 * Hook to fetch camera status
 */
export function useCameraStatus() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const data = await analyticsApi.fetchCameraStatus();
        if (isMounted) setCameras(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { cameras, loading, error };
}
