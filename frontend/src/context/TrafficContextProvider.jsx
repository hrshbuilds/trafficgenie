import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * TrafficContext - Provides real-time traffic data and current page context
 * Tracks: current page, live violations, stats, hotspots
 */
const TrafficContext = createContext(null);

export function TrafficContextProvider({ children }) {
  // Current page info
  const [currentPage, setCurrentPage] = useState('home');
  const [pageData, setPageData] = useState({});
  
  // Live data
  const [liveViolations, setLiveViolations] = useState([]);
  const [liveStats, setLiveStats] = useState({
    totalViolations: 0,
    pendingChallans: 0,
    reviewedChallans: 0,
    approvedChallans: 0,
    hotspots: [],
    activeCameras: 0,
  });
  
  // Data fetch state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const updateIntervalRef = useRef(null);

  // CONTEXT OBJECT - Enhanced for AI queries
  const getContextString = useCallback(() => {
    return `
CURRENT CONTEXT:
- Page: ${currentPage}
- Page Data: ${JSON.stringify(pageData, null, 2)}

LIVE TRAFFIC DATA:
- Total Violations Today: ${liveStats.totalViolations}
- Pending Challans: ${liveStats.pendingChallans}
- Reviewed: ${liveStats.reviewedChallans}
- Approved: ${liveStats.approvedChallans}
- Active Cameras: ${liveStats.activeCameras}
- Recent Violations: ${JSON.stringify(liveViolations.slice(0, 5), null, 2)}
- Hotspots: ${JSON.stringify(liveStats.hotspots, null, 2)}
    `.trim();
  }, [currentPage, pageData, liveStats, liveViolations]);

  // Fetch live violations
  const fetchLiveViolations = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/violations?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setLiveViolations(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch live violations:', err);
      setError(err.message);
    }
  }, []);

  // Fetch challan stats
  const fetchLiveStats = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/challans`);
      if (response.ok) {
        const data = await response.json();
        const challans = data.data || [];
        
        const stats = {
          totalViolations: challans.length,
          pendingChallans: challans.filter(c => c.status === 'pending').length,
          reviewedChallans: challans.filter(c => c.status === 'reviewed').length,
          approvedChallans: challans.filter(c => c.status === 'approved').length,
          hotspots: aggregateHotspots(challans),
          activeCameras: new Set(challans.map(c => c.camera_id)).size,
        };
        
        setLiveStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch live stats:', err);
      setError(err.message);
    }
  }, []);

  // Update live data periodically
  useEffect(() => {
    const updateData = async () => {
      setLoading(true);
      await Promise.all([fetchLiveViolations(), fetchLiveStats()]);
      setLoading(false);
    };

    // Initial fetch
    updateData();

    // Refresh every 10 seconds
    updateIntervalRef.current = setInterval(updateData, 10000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [fetchLiveViolations, fetchLiveStats]);

  // Update current page
  const updateCurrentPage = useCallback((page, data = {}) => {
    setCurrentPage(page);
    setPageData(data);
  }, []);

  // Refresh data on demand
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchLiveViolations(), fetchLiveStats()]);
    setLoading(false);
  }, [fetchLiveViolations, fetchLiveStats]);

  const value = {
    // Current Context
    currentPage,
    pageData,
    updateCurrentPage,
    
    // Live Data
    liveViolations,
    liveStats,
    
    // State
    loading,
    error,
    refreshData,
    
    // For AI queries
    getContextString,
  };

  return (
    <TrafficContext.Provider value={value}>
      {children}
    </TrafficContext.Provider>
  );
}

export function useTrafficContext() {
  const context = useContext(TrafficContext);
  if (!context) {
    throw new Error('useTrafficContext must be used within TrafficContextProvider');
  }
  return context;
}

/**
 * Aggregate violations by location to identify hotspots
 */
function aggregateHotspots(challans) {
  const hotspots = {};
  
  challans.forEach(challan => {
    const location = challan.location || 'Unknown';
    if (!hotspots[location]) {
      hotspots[location] = 0;
    }
    hotspots[location]++;
  });

  return Object.entries(hotspots)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
