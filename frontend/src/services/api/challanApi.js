import { apiFetch } from '../api.js';

/**
 * Fetch all challans with optional filters
 */
export async function fetchChallans(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/challans?${queryString}` : '/challans';
    
    const data = await apiFetch(url);
    return normalizeChallans(data.results || data);
  } catch (error) {
    console.error('Failed to fetch challans:', error);
    throw error;
  }
}

/**
 * Fetch a single challan by ID
 */
export async function fetchChallanById(id) {
  const data = await apiFetch(`/challans/${id}`);
  return normalizeChallan(data);
}

/**
 * Approve a challan
 */
export async function approveChallan(id) {
  return apiFetch(`/challans/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' })
  });
}

/**
 * Reject a challan
 */
export async function rejectChallan(id, reason) {
  return apiFetch(`/challans/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected', reason })
  });
}

/**
 * Download challan PDF
 */
export async function downloadChallanPDF(id) {
  return apiFetch(`/challans/${id}/pdf`, {
    headers: { Accept: 'application/pdf' }
  });
}

function normalizeChallan(raw) {
  return {
    id: raw.id || raw._id,
    image: raw.image_url || raw.image,
    plate: raw.plate_number || raw.plate,
    type: raw.violation_type || raw.type,
    location: raw.location || raw.loc,
    timestamp: raw.timestamp || raw.time,
    confidence: raw.confidence || raw.conf,
    status: raw.status || 'pending',
    fineAmount: raw.fine_amount || 1000,
  };
}

function normalizeChallans(data) {
  if (!data) return [];
  return Array.isArray(data) ? data.map(normalizeChallan) : [];
}

export default {
  fetchChallans,
  fetchChallanById,
  approveChallan,
  rejectChallan,
  downloadChallanPDF,
};
