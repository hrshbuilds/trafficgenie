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
  try {
    // Try simple query first without orderBy to avoid timestamp issues
    const constraints = [limit(options.limit || 50)];
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
        // Sort by detected_at or timestamp if available
        violations.sort((a, b) => {
          const timeA = a.detected_at || a.timestamp || new Date(0);
          const timeB = b.detected_at || b.timestamp || new Date(0);
          return new Date(timeB) - new Date(timeA);
        });
        callback(violations);
      },
      (error) => {
        console.warn('Firestore query error (expected if collection empty):', error.message);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Firestore setup error, will use API fallback:', error.message);
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
        console.warn('Agent logs query error (expected if collection empty):', error.message);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Firestore agent logs setup error, will use demo data fallback:', error.message);
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
    // Simple query without orderBy to avoid timestamp issues
    const q = query(
      collection(db, 'violations'),
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
          activeViolations: violations.filter(v => v.challan_status === 'pending' || v.status === 'active').length,
          urgentViolations: violations.filter(v => v.challan_status === 'rejected' || v.status === 'urgent').length,
          resolvedViolations: violations.filter(v => v.challan_status === 'approved' || v.status === 'resolved').length,
          averageRisk: violations.length > 0 
            ? Math.round(violations.reduce((sum, v) => sum + (v.risk || Math.round(v.confidence * 0.8) || 0), 0) / violations.length)
            : 0,
          alerts: violations.filter(v => v.challan_status === 'rejected' || v.status === 'urgent').length
        };

        callback(stats);
      },
      (error) => {
        console.warn('Firestore stats error (expected if collection empty):', error.message);
        callback({
          totalViolations: 0,
          activeViolations: 0,
          urgentViolations: 0,
          resolvedViolations: 0,
          averageRisk: 0,
          alerts: 0
        });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to set up stats listener:', error);
    return () => {};
  }
}
