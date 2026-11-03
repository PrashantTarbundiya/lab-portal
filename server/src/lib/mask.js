/**
 * Masking utilities for phone numbers and names.
 * Used to protect PII in patient-facing API responses.
 */

/**
 * Mask a phone number, showing only last 4 digits.
 * @param {string} e164 — E.164 formatted phone number (e.g., "+919876543210")
 * @returns {string} — e.g., "••••••3210"
 */
export function maskPhone(e164) {
  if (!e164 || typeof e164 !== 'string') return '••••••••••';
  const digits = e164.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••••';
  const last4 = digits.slice(-4);
  return '••••••' + last4;
}

/**
 * Mask a full name as initials (e.g., "Lakshmi Priya K" → "L.P.K").
 * @param {string} fullName
 * @returns {string}
 */
export function maskName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '•';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  return parts.map(p => p.charAt(0).toUpperCase()).join('.');
}

/**
 * Mask a phone number for OTP gate display, showing only last 4 digits.
 * @param {string} e164
 * @returns {string} — e.g., "••••1234"
 */
export function maskPhonePartial(e164) {
  if (!e164 || typeof e164 !== 'string') return '••••••••';
  const digits = e164.replace(/\D/g, '');
  if (digits.length < 4) return '••••••••';
  const last4 = digits.slice(-4);
  return '••••' + last4;
}
