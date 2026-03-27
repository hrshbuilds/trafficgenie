/**
 * Format currency for Indian locale
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date/time
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour12: false });
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN');
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', { hour12: false });
}

/**
 * Format vehicle plate
 */
export function formatPlate(plate) {
  if (!plate) return '';
  return plate.toUpperCase().replace(/(.{2})(?=.)/g, "$1-");
}

/**
 * Format percentage
 */
export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

/**
 * Truncate text
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}
