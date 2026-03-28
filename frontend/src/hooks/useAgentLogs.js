import { useState, useEffect } from 'react';
import { subscribeToAgentLogs } from '../services/firebaseRealtimeDb';

// Demo agent logs for fallback
const DEMO_AGENT_LOGS = [
  { tool: 'analyze', msg: '<strong>analyze_frame</strong> → No Helmet confirmed', result: '94.2% conf', time: '13:13:42' },
  { tool: 'log', msg: '<strong>log_violation</strong> → #TW-4821 pushed', result: 'Firebase ✓', time: '13:13:42' },
  { tool: 'challan', msg: '<strong>generate_challan</strong> → ₹1,000 fine drafted', result: 'PDF ready', time: '13:13:43' },
  { tool: 'risk', msg: '<strong>risk_score</strong> → MH-15-XZ scored <strong>78</strong>', result: 'Alert fired', time: '13:13:45' },
  { tool: 'analyze', msg: '<strong>analyze_frame</strong> → Signal Jump detected', result: '91.8% conf', time: '13:14:02' },
  { tool: 'log', msg: '<strong>log_violation</strong> → #TW-4822 pushed', result: 'Firebase ✓', time: '13:14:02' },
  { tool: 'verify', msg: '<strong>verify_evidence</strong> → Images validated', result: 'All clear', time: '13:14:03' },
  { tool: 'analyze', msg: '<strong>analyze_frame</strong> → Triple Riding detected', result: '97.1% conf', time: '13:14:15' },
];

/**
 * Real-time hook for agent logs
 * Streams agent actions and processes in real-time
 * Falls back to demo data if Firebase fails
 * @param {Object} options - {limit}
 */
export function useAgentLogs(options = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let firebaseUnsubscribe = null;

    // Try Firebase subscription first
    try {
      firebaseUnsubscribe = subscribeToAgentLogs(
        (data) => {
          if (isMounted) {
            if (data && data.length > 0) {
              setLogs(data.slice(0, options.limit || 20));
              setError(null);
            } else {
              // If Firebase is empty, use demo data
              setLogs(DEMO_AGENT_LOGS.slice(0, options.limit || 20));
            }
            setLoading(false);
          }
        },
        options
      );
    } catch (err) {
      // If Firebase subscription fails, use demo data
      if (isMounted) {
        console.warn('Firebase agent logs failed, using demo data:', err.message);
        setLogs(DEMO_AGENT_LOGS.slice(0, options.limit || 20));
        setError(null);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
    };
  }, [options.limit]);

  const addLog = (log) => {
    setLogs(prev => {
      // Prevent duplicates and limit to max 20 logs
      if (prev.some(l => l.id === log.id)) return prev;
      return [log, ...prev].slice(0, 20);
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return {
    logs,
    loading,
    error,
    addLog,
    clearLogs,
  };
}
