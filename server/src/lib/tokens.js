/**
 * Secure link token generation and verification utilities.
 */
import crypto from 'crypto';

/** Default link TTL in hours from env or 72h fallback */
export const LINK_TTL_HOURS = parseInt(process.env.LINK_TTL_HOURS, 10) || 72;

/**
 * Generate a cryptographically secure token pair.
 * @returns {{ raw: string, hash: string }} — raw (base64url) for the link, hash (sha256 hex) for storage
 */
export function generateToken() {
  const bytes = crypto.randomBytes(32);
  const raw = bytes.toString('base64url');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

/**
 * Hash a raw token string to its sha256 hex digest.
 * @param {string} raw
 * @returns {string}
 */
export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Constant-time comparison of two strings to prevent timing attacks.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}
