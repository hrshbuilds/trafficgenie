import { apiFetch } from '../api.js';

/**
 * Fetch all violations with optional filters
 * @param {Object} options - Filter options
 * @param {string} options.ward - Filter by ward name
 * @param {string} options.type - Filter by violation type
 * @param {string} options.status - Filter by status (active, resolved, etc)
 * @param {number} options.limit - Max records to fetch (default 50)
 * @returns {Promise<Array>} Normalized violations
 */
export async function fetchViolations(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.ward) params.append('ward', options.ward);
    if (options.type) params.append('type', options.type);
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/violations?${queryString}` : '/violations';
    
    const data = await apiFetch(url);
    return normalizeViolations(data.results || data);
  } catch (error) {
    console.error('Failed to fetch violations:', error);
    throw error;
  }
}

/**
 * Fetch a single violation by ID
 */
export async function fetchViolationById(id) {
  const data = await apiFetch(`/violations/${id}`);
  return normalizeViolation(data);
}

/**
 * Fetch recent violations (for live feed)
 */
export async function fetchRecentViolations(limit = 10) {
  return fetchViolations({ limit, status: 'active' });
}

/**
 * Create a challan for a violation
 */
export async function createChallan(violationId, details = {}) {
  const data = await apiFetch(`/violations/${violationId}/challan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  });
  return data;
}

/**
 * Normalize API response to match UI expectations
 */
function normalizeViolation(raw) {
  return {
    id: raw.id || raw._id,
    type: raw.violation_type || raw.type,
    type_hi: getHindiName(raw.violation_type || raw.type),
    icon: getViolationIcon(raw.violation_type || raw.type),
    status: raw.status || 'active',
    conf: Math.round((raw.confidence || raw.conf || 0) * 100),
    loc: raw.location || raw.loc,
    ward: raw.ward_name || raw.ward,
    cam: raw.camera_id || raw.cam,
    plate: raw.plate_number || raw.plate,
    risk: raw.risk_score || calculateRisk(raw),
    narration: raw.description || raw.narration,
    time: formatTime(raw.timestamp || raw.time),
    timestamp: new Date(raw.timestamp || raw.time),
    image: raw.image_url || raw.image,
    confidence: raw.confidence || raw.conf,
  };
}

function normalizeViolations(data) {
  if (!data) return [];
  return Array.isArray(data) ? data.map(normalizeViolation) : [];
}

// Helper function: Map violation type to icon
function getViolationIcon(type) {
  const typeStr = (type || '').toLowerCase();
  const icons = {
    'no_helmet': '🪖',
    'helmet': '🪖',
    'red_light': '🚦',
    'signal_jump': '🚦',
    'red': '🚦',
    'triple_riding': '🏍️',
    'triple': '🏍️',
    'wrong_side': '⛔',
    'wrong_direction': '⛔',
    'wrong_lane': '⛔',
    'speed_breach': '⚡',
    'speed': '⚡',
    'zebra_cross': '🦺',
    'zebra': '🦺',
  };
  return icons[typeStr] || '📷';
}

// Helper: Get Hindi name
function getHindiName(type) {
  const namesHi = {
    no_helmet: 'बिना हेलमेट',
    signal_jump: 'लाल बत्ती',
    triple_riding: 'तीन सवारी',
    wrong_side: 'गलत दिशा',
    speed: 'गति उल्लंघन',
    zebra_cross: 'ज़ेब्रा क्रॉसिंग',
  };
  return namesHi[(type || '').toLowerCase()] || type;
}

// Helper: Format time
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour12: false });
}

// Helper: Calculate risk score
function calculateRisk(violation) {
  const confidence = violation.confidence || violation.conf || 0;
  const severity = violation.severity || 'medium';
  const baseScore = Math.round(confidence * 100);
  const severityMultiplier = severity === 'high' ? 1.2 : severity === 'low' ? 0.7 : 1;
  return Math.min(Math.round(baseScore * severityMultiplier), 100);
}

export default {
  fetchViolations,
  fetchViolationById,
  fetchRecentViolations,
  createChallan,
};
