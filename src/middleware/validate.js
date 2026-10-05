/**
 * Sanitizes string input to prevent XSS script injection
 */
export function sanitizeString(val) {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates Email string format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates Indian PAN format (5 letters, 4 digits, 1 letter)
 */
export function isValidPan(pan) {
  if (!pan || typeof pan !== 'string') return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
}

/**
 * Validates Phone number format (10-15 digits)
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
  return phoneRegex.test(phone.trim());
}
