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
 * Transform API violation data to UI format
 * @param {Object} v - API violation object
 * @returns {Object} Transformed violation with UI fields
 */
function transformViolationData(v) {
  const iconMap = {
    'Signal Jump': '🚦',
    'Wrong Lane': '🛣️',
    'No Helmet': '🪖',
    'Triple Riding': '🏍️',
    'No License Plate': '📝',
    'Speeding': '⚡',
    'Mobile Use': '📱',
    'Zebra Crossing': '🚶',
  };

  const hindiMap = {
    'Signal Jump': 'लाल बत्ती',
    'Wrong Lane': 'गलत दिशा',
    'No Helmet': 'बिना हेलमेट',
    'Triple Riding': 'तीन सवारी',
    'No License Plate': 'लाइसेंस न होना',
    'Speeding': 'गति उल्लंघन',
    'Mobile Use': 'मोबाइल उपयोग',
    'Zebra Crossing': 'ज़ेब्रा क्रॉसिंग',
  };

  const statusMap = {
    'pending': 'active',
    'approved': 'resolved',
    'rejected': 'urgent'
  };

  const detectedDate = new Date(v.detected_at);
  const time = detectedDate.toLocaleTimeString('en-IN', { hour12: false });
  
  // Base risk calculation on confidence
  const risk = Math.round(v.confidence * 0.8);

  return {
    id: v.id,
    type: v.type,
    type_hi: hindiMap[v.type] || v.type,
    icon: iconMap[v.type] || '🚗',
    status: statusMap[v.challan_status] || 'active',
    conf: Math.round(v.confidence),
    loc: v.location,
    ward: v.ward,
    cam: `CAM-${v.id % 9 + 1}`,
    plate: v.plate,
    risk: risk,
    narration: `${v.type} detected at ${v.location}. Fine: ₹${risk >= 65 ? 2000 : 1000}.`,
    time: time,
    detected_at: v.detected_at,
    zone: v.zone,
  };
}

/**
 * Real-time hook using Firestore listeners
 * Updates live as violations are added to database
 * Falls back to API if Firestore fails
 * @param {Object} options - {limit}
 */
export function useRealtimeViolations(options = {}) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let firebaseUnsubscribe = null;

    // Try to subscribe to Firestore
    try {
      firebaseUnsubscribe = subscribeToViolations(
        (data) => {
          if (isMounted) {
            if (data && data.length > 0) {
              const transformed = data.map(v => transformViolationData(v));
              setViolations(transformed);
              setError(null);
            } else {
              // If Firestore is empty, try API as fallback
              fetchFromAPI();
            }
            setLoading(false);
          }
        },
        options
      );
    } catch (err) {
      // If Firestore subscription fails, fall back to API
      if (isMounted) {
        console.warn('Firestore subscription failed, using API fallback:', err.message);
        fetchFromAPI();
      }
    }

    // Fallback function to fetch from API
    async function fetchFromAPI() {
      try {
        const data = await violationApi.fetchViolations({ limit: options.limit || 50 });
        if (isMounted) {
          const transformed = data.map(v => transformViolationData(v));
          setViolations(transformed);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch violations');
          setLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
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
