/**
 * Mobile number hashing and normalization.
 * Used for privacy-preserving patient lookup.
 */
import crypto from 'crypto';

/**
 * Create an HMAC-SHA256 hash of an E.164 mobile number.
 * @param {string} mobileE164
 * @returns {string} — hex hash
 */
export function hashMobile(mobileE164) {
  return crypto
    .createHmac('sha256', process.env.APP_HASH_SECRET || 'dev-secret')
    .update(mobileE164)
    .digest('hex');
}

/**
 * Normalize an Indian mobile number to E.164 format (+91XXXXXXXXXX).
 * Strips whitespace, dashes, parentheses, leading +91 or 0.
 * @param {string} raw
 * @returns {string|null} — E.164 formatted number, or null if invalid
 */
export function normalizeMobile(raw) {
  let m = raw.toString().trim().replace(/[\s\-()]/g, '');
  m = m.replace(/^\+91/, '').replace(/^0/, '');
  if (/^[6-9]\d{9}$/.test(m)) return '+91' + m;
  return null;
}
