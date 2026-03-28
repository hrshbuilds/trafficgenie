import { useState, useEffect } from 'react';
import { subscribeToViolationStats } from '../services/firebaseRealtimeDb';
import * as violationApi from '../services/api/violationApi';

/**
 * Calculate stats from violations array
 * @param {Array} violations - Array of violation objects
 * @returns {Object} Stats object
 */
function calculateStats(violations) {
  if (!violations || violations.length === 0) {
    return {
      totalViolations: 0,
      activeViolations: 0,
      urgentViolations: 0,
      resolvedViolations: 0,
      averageRisk: 0,
      alerts: 0,
    };
  }

  const active = violations.filter(v => v.status === 'active' || v.challan_status === 'pending').length;
  const urgent = violations.filter(v => v.status === 'urgent' || v.challan_status === 'rejected').length;
  const resolved = violations.filter(v => v.status === 'resolved' || v.challan_status === 'approved').length;
  
  const avgRisk = violations.length > 0
    ? Math.round(violations.reduce((sum, v) => sum + (v.risk || Math.round(v.confidence * 0.8) || 0), 0) / violations.length)
    : 0;

  return {
    totalViolations: violations.length,
    activeViolations: active,
    urgentViolations: urgent,
    resolvedViolations: resolved,
    averageRisk: avgRisk,
    alerts: urgent,
  };
}

/**
 * Real-time hook for dashboard stats
 * Aggregates and streams dashboard metrics
 * Falls back to API if Firestore fails
 * @param {Object} options - Additional options
 */
export function useRealtimeStats(options = {}) {
  const [stats, setStats] = useState({
    totalViolations: 0,
    activeViolations: 0,
    urgentViolations: 0,
    resolvedViolations: 0,
    averageRisk: 0,
    alerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = null;

    // Try Firebase first
    try {
      unsubscribe = subscribeToViolationStats((data) => {
        if (isMounted) {
          setStats(data);
          setError(null);
          setLoading(false);
        }
      });
    } catch (err) {
      // If Firebase fails, fall back to API
      if (isMounted) {
        console.warn('Firebase stats failed, using API fallback:', err.message);
        fetchStatsFromAPI();
      }
    }

    // Fallback function to fetch stats from API
    async function fetchStatsFromAPI() {
      try {
        const violations = await violationApi.fetchViolations({ limit: 100 });
        if (isMounted) {
          const calculatedStats = calculateStats(violations);
          setStats(calculatedStats);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
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
    alerts: stats.alerts,
  };
}
