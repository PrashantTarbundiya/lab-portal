/**
 * Pure functions for parsing reference ranges and computing result flags.
 */

/**
 * Parse a numeric value string, stripping whitespace and handling decimals.
 * @param {string} valueStr
 * @returns {number|null}
 */
export function parseNumericValue(valueStr) {
  if (valueStr == null) return null;
  const trimmed = String(valueStr).trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parse a reference range string into a structured object.
 * Supports: "a-b", "a–b" (en-dash), "<b", "<=b", ">a", ">=a"
 * @param {string} raw
 * @returns {{ op: 'RANGE'|'LT'|'GT'|'LTE'|'GTE', low?: number, high?: number }|null}
 */
export function parseRange(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '') return null;

  // <=value or ≤value
  const lteMatch = s.match(/^[<≤]\s*=\s*(.+)$/) || s.match(/^≤\s*(.+)$/);
  if (lteMatch) {
    const high = parseNumericValue(lteMatch[1]);
    return high != null ? { op: 'LTE', high } : null;
  }

  // >=value or ≥value
  const gteMatch = s.match(/^[>≥]\s*=\s*(.+)$/) || s.match(/^≥\s*(.+)$/);
  if (gteMatch) {
    const low = parseNumericValue(gteMatch[1]);
    return low != null ? { op: 'GTE', low } : null;
  }

  // <value (strict)
  const ltMatch = s.match(/^<\s*(.+)$/);
  if (ltMatch) {
    const high = parseNumericValue(ltMatch[1]);
    return high != null ? { op: 'LT', high } : null;
  }

  // >value (strict)
  const gtMatch = s.match(/^>\s*(.+)$/);
  if (gtMatch) {
    const low = parseNumericValue(gtMatch[1]);
    return low != null ? { op: 'GT', low } : null;
  }

  // Range: a-b or a–b (en-dash) or a — b
  const rangeMatch = s.match(/^([0-9.,\s]+)\s*[-–—]\s*([0-9.,\s]+)$/);
  if (rangeMatch) {
    const low = parseNumericValue(rangeMatch[1]);
    const high = parseNumericValue(rangeMatch[2]);
    if (low != null && high != null) {
      return { op: 'RANGE', low, high };
    }
    return null;
  }

  return null;
}

/**
 * Compute a result flag from a numeric value and parsed range.
 * Value equal to boundary = NORMAL.
 * @param {number|string} valueNum
 * @param {{ op: string, low?: number, high?: number }|null} parsedRange
 * @returns {'NORMAL'|'LOW'|'HIGH'|'UNKNOWN'}
 */
export function computeFlag(valueNum, parsedRange) {
  const num = typeof valueNum === 'number' ? valueNum : parseNumericValue(valueNum);
  if (num == null) return 'UNKNOWN';
  if (parsedRange == null) return 'UNKNOWN';

  switch (parsedRange.op) {
    case 'RANGE': {
      if (num < parsedRange.low) return 'LOW';
      if (num > parsedRange.high) return 'HIGH';
      return 'NORMAL';
    }
    case 'LT':
    case 'LTE': {
      if (num > parsedRange.high) return 'HIGH';
      return 'NORMAL';
    }
    case 'GT':
    case 'GTE': {
      if (num < parsedRange.low) return 'LOW';
      return 'NORMAL';
    }
    default:
      return 'UNKNOWN';
  }
}
