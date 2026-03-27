import { useState, useEffect } from 'react';
import { subscribeToAgentLogs } from '../services/firebaseRealtimeDb';

/**
 * Real-time hook for agent logs
 * Streams agent actions and processes in real-time
 * @param {Object} options - {limit}
 */
export function useAgentLogs(options = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToAgentLogs(
      (data) => {
        setLogs(data);
        setLoading(false);
      },
      options
    );

    return () => {
      unsubscribe();
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
