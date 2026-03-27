/**
 * Validate email address
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone number (India)
 */
export function isValidPhone(phone) {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone.replace(/\D/g, ''));
}

/**
 * Validate vehicle plate (India format: MH-15-AB-1234)
 */
export function isValidPlate(plate) {
  const regex = /^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/;
  return regex.test(plate.toUpperCase());
}

/**
 * Validate password strength
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}
