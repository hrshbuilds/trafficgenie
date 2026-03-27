import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Subscribe to real-time violations from Firestore
 * Listen for new violations as they're added
 * @param {Function} callback - Called with violations array whenever data changes
 * @param {Object} options - {limit, filters}
 * @returns {Function} Unsubscribe function
 */
export function subscribeToViolations(callback, options = {}) {
  const constraints = [
    orderBy('timestamp', 'desc'),
    limit(options.limit || 50)
  ];

  try {
    const q = query(collection(db, 'violations'), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const violations = [];
        snapshot.forEach(doc => {
          violations.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(violations);
      },
      (error) => {
        console.error('Error listening to violations:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up violations listener:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
}

/**
 * Subscribe to real-time agent logs from Firestore
 * @param {Function} callback - Called with logs array whenever data changes
 * @param {Object} options - {limit}
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAgentLogs(callback, options = {}) {
  const constraints = [
    orderBy('timestamp', 'desc'),
    limit(options.limit || 20)
  ];

  try {
    const q = query(collection(db, 'agent_logs'), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = [];
        snapshot.forEach(doc => {
          logs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(logs);
      },
      (error) => {
        console.error('Error listening to agent logs:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up agent logs listener:', error);
    return () => {};
  }
}

/**
 * Subscribe to new violations only (for alerts)
 * Listens for violations created in the last few minutes
 * @param {Function} callback - Called with new violation
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNewViolations(callback) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    const q = query(
      collection(db, 'violations'),
      where('timestamp', '>=', fiveMinutesAgo),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            callback({
              id: change.doc.id,
              ...change.doc.data()
            });
          }
        });
      },
      (error) => {
        console.error('Error listening to new violations:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up new violations listener:', error);
    return () => {};
  }
}

/**
 * Subscribe to real-time stats/summary for dashboard
 * Aggregates violation data for dashboard metrics
 * @param {Function} callback - Called with stats
 * @returns {Function} Unsubscribe function
 */
export function subscribeToViolationStats(callback) {
  try {
    const q = query(
      collection(db, 'violations'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const violations = [];
        snapshot.forEach(doc => {
          violations.push(doc.data());
        });

        // Calculate stats
        const stats = {
          totalViolations: violations.length,
          activeViolations: violations.filter(v => v.status === 'active').length,
          urgentViolations: violations.filter(v => v.status === 'urgent').length,
          resolvedViolations: violations.filter(v => v.status === 'resolved').length,
          averageRisk: violations.length > 0 
            ? Math.round(violations.reduce((sum, v) => sum + (v.risk || 0), 0) / violations.length)
            : 0
        };

        callback(stats);
      },
      (error) => {
        console.error('Error listening to stats:', error);
        callback({
          totalViolations: 0,
          activeViolations: 0,
          urgentViolations: 0,
          resolvedViolations: 0,
          averageRisk: 0
        });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up stats listener:', error);
    return () => {};
  }
}
