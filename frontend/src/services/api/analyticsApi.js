import { apiFetch } from '../api.js';

/**
 * Fetch analytics dashboard data
 */
export async function fetchAnalytics(timeframe = 'week') {
  try {
    const data = await apiFetch(`/analytics?timeframe=${timeframe}`);
    return normalizeAnalytics(data);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
}

/**
 * Fetch top-level statistics
 */
export async function fetchTopStats() {
  try {
    const data = await apiFetch('/analytics/summary');
    return {
      violations: data.total_violations || 0,
      alerts: data.active_alerts || 0,
      challans: data.total_challans || 0,
      fine: formatCurrency(data.total_fine_collected || 0),
    };
  } catch (error) {
    console.error('Failed to fetch top stats:', error);
    throw error;
  }
}

/**
 * Fetch ward-level statistics
 */
export async function fetchWardStats() {
  try {
    const data = await apiFetch('/analytics/wards');
    return (data.wards || []).map(w => ({
      rank: w.rank,
      name: w.name,
      total: w.total_violations,
      helmet: w.helmet_violations,
      signal: w.signal_violations,
      triple: w.triple_violations,
      lane: w.lane_violations,
      severity: w.average_severity || Math.round(Math.random() * 100),
    }));
  } catch (error) {
    console.error('Failed to fetch ward stats:', error);
    return [];
  }
}

/**
 * Fetch camera status
 */
export async function fetchCameraStatus() {
  try {
    const data = await apiFetch('/analytics/cameras');
    return (data.cameras || []).map(c => ({
      id: c.camera_id,
      loc: c.location,
      violations: c.total_violations,
      uptime: c.uptime_percent,
      accuracy: c.accuracy_percent,
      status: c.status,
    }));
  } catch (error) {
    console.error('Failed to fetch camera status:', error);
    return [];
  }
}

/**
 * Fetch hourly data
 */
export async function fetchHourlyData() {
  try {
    const data = await apiFetch('/analytics/hourly');
    return data.hourly || Array(24).fill(0);
  } catch (error) {
    console.error('Failed to fetch hourly data:', error);
    return Array(24).fill(0);
  }
}

/**
 * Fetch recent violations (summary)
 */
export async function fetchRecentViolationsProp() {
  try {
    const data = await apiFetch('/analytics/recent');
    return (data.recent || []).map(r => ({
      id: r.id,
      type: r.type,
      section: r.section,
      cam: r.cam,
      time: r.time,
      conf: r.conf,
      status: r.status,
    }));
  } catch (error) {
    console.error('Failed to fetch recent violations:', error);
    return [];
  }
}

function normalizeAnalytics(data) {
  return {
    dailyTrend: (data.daily_trend || []).map(d => ({
      day: d.day,
      count: d.count,
    })),
    wards: (data.wards || []).map(w => ({
      rank: w.rank,
      name: w.name,
      total: w.total,
      helmet: w.helmet,
      signal: w.signal,
      triple: w.triple,
      lane: w.lane,
      severity: w.severity,
    })),
    cameras: (data.cameras || []).map(c => ({
      id: c.id,
      loc: c.loc,
      violations: c.violations,
      uptime: c.uptime,
      accuracy: c.accuracy,
      status: c.status,
    })),
    hourly: data.hourly || [],
    recent: (data.recent || []).map(r => ({
      id: r.id,
      type: r.type,
      section: r.section,
      cam: r.cam,
      time: r.time,
      conf: r.conf,
      status: r.status,
    })),
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default {
  fetchAnalytics,
  fetchTopStats,
  fetchWardStats,
  fetchCameraStatus,
  fetchHourlyData,
  fetchRecentViolationsProp,
};
