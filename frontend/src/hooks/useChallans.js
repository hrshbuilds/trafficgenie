import { useState, useEffect } from 'react';
import * as challanApi from '../services/api/challanApi';

/**
 * Hook to fetch and manage challans
 */
export function useChallans(options = {}) {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await challanApi.fetchChallans(options);
        if (isMounted) {
          setChallans(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch challans');
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
  }, [options.status, options.limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await challanApi.fetchChallans(options);
      setChallans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      await challanApi.approveChallan(id);
      setChallans(prev =>
        prev.map(c => c.id === id ? { ...c, status: 'approved' } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const reject = async (id, reason) => {
    try {
      await challanApi.rejectChallan(id, reason);
      setChallans(prev =>
        prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    challans,
    loading,
    error,
    refetch,
    approve,
    reject,
  };
}
