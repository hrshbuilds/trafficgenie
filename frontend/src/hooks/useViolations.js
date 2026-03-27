import { useState, useEffect } from 'react';
import * as violationApi from '../services/api/violationApi';
import { subscribeToViolations, subscribeToNewViolations } from '../services/firebaseRealtimeDb';

/**
 * Custom hook to fetch and manage violations
 * @param {Object} options - {ward, type, status, limit}
 */
export function useViolations(options = {}) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await violationApi.fetchViolations(options);
        if (isMounted) {
          setViolations(data);
          setHasMore(data.length >= (options.limit || 50));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch violations');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [options.ward, options.type, options.status, options.limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await violationApi.fetchViolations(options);
      setViolations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addViolation = (violation) => {
    setViolations(prev => {
      // Avoid duplicates
      if (prev.some(v => v.id === violation.id)) return prev;
      return [violation, ...prev];
    });
  };

  const updateViolation = (id, updates) => {
    setViolations(prev =>
      prev.map(v => v.id === id ? { ...v, ...updates } : v)
    );
  };

  const removeViolation = (id) => {
    setViolations(prev => prev.filter(v => v.id !== id));
  };

  return {
    violations,
    loading,
    error,
    hasMore,
    refetch,
    addViolation,
    updateViolation,
    removeViolation,
  };
}

/**
 * Real-time hook using Firestore listeners
 * Updates live as violations are added to database
 * @param {Object} options - {limit}
 */
export function useRealtimeViolations(options = {}) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try Firestore first
    const unsubscribe = subscribeToViolations(
      (data) => {
        setViolations(data);
        setLoading(false);
      },
      options
    );

    return () => {
      unsubscribe();
    };
  }, [options.limit]);

  const addViolation = (violation) => {
    setViolations(prev => {
      if (prev.some(v => v.id === violation.id)) return prev;
      return [violation, ...prev];
    });
  };

  const updateViolation = (id, updates) => {
    setViolations(prev =>
      prev.map(v => v.id === id ? { ...v, ...updates } : v)
    );
  };

  const removeViolation = (id) => {
    setViolations(prev => prev.filter(v => v.id !== id));
  };

  return {
    violations,
    loading,
    error,
    addViolation,
    updateViolation,
    removeViolation,
  };
}

/**
 * Hook to listen only for NEW violations (for alerts)
 * Triggers callback for each new violation
 * @param {Function} onNewViolation - Callback for new violation
 * @returns {Object} {isListening}
 */
export function useRealtimeNewViolations(onNewViolation) {
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToNewViolations((violation) => {
      if (onNewViolation) {
        onNewViolation(violation);
      }
    });

    setIsListening(true);

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [onNewViolation]);

  return { isListening };
}
