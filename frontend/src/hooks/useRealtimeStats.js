import { useState, useEffect } from 'react';
import { subscribeToViolationStats } from '../services/firebaseRealtimeDb';

/**
 * Real-time hook for dashboard stats
 * Aggregates and streams dashboard metrics
 * @param {Object} options - Additional options
 */
export function useRealtimeStats(options = {}) {
  const [stats, setStats] = useState({
    totalViolations: 0,
    activeViolations: 0,
    urgentViolations: 0,
    resolvedViolations: 0,
    averageRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToViolationStats((data) => {
      setStats(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    stats,
    loading,
    error,
    totalViolations: stats.totalViolations,
    activeViolations: stats.activeViolations,
    urgentViolations: stats.urgentViolations,
    resolvedViolations: stats.resolvedViolations,
    averageRisk: stats.averageRisk,
  };
}
