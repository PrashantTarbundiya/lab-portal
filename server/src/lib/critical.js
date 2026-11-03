/**
 * Critical value rules and flag adjustment logic.
 */

/**
 * Hardcoded critical value rules for 10 common lab parameters.
 * criticalLow/criticalHigh of null means no critical boundary on that side.
 */
export const CRITICAL_RULES = [
  { parameter: 'Potassium', criticalLow: 2.5, criticalHigh: 6.5 },
  { parameter: 'Sodium', criticalLow: 120, criticalHigh: 160 },
  { parameter: 'Haemoglobin', criticalLow: 7.0, criticalHigh: 20.0 },
  { parameter: 'Glucose fasting', criticalLow: 40, criticalHigh: 450 },
  { parameter: 'Fasting glucose', criticalLow: 40, criticalHigh: 450 },
  { parameter: 'Glucose, fasting', criticalLow: 40, criticalHigh: 450 },
  { parameter: 'Platelet count', criticalLow: 20, criticalHigh: 1000 },
  { parameter: 'Calcium', criticalLow: 6.0, criticalHigh: 13.0 },
  { parameter: 'Creatinine', criticalLow: null, criticalHigh: 10.0 },
  { parameter: 'TSH', criticalLow: null, criticalHigh: 50 },
  { parameter: 'Total WBC', criticalLow: 2.0, criticalHigh: 30.0 },
  { parameter: 'INR', criticalLow: null, criticalHigh: 5.0 },
];

/**
 * Normalize a parameter name for fuzzy matching.
 * @param {string} name
 * @returns {string}
 */
function normalize(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find a matching critical rule for a parameter (case-insensitive fuzzy match).
 * @param {string} parameter
 * @returns {{ parameter: string, criticalLow: number|null, criticalHigh: number|null }|null}
 */
export function findCriticalRule(parameter) {
  if (!parameter) return null;
  const norm = normalize(parameter);
  return CRITICAL_RULES.find(r => normalize(r.parameter) === norm) || null;
}

/**
 * Apply critical value rules to adjust a base flag.
 * LOW → CRITICAL_LOW if value is at or below criticalLow.
 * HIGH → CRITICAL_HIGH if value is at or above criticalHigh.
 * @param {string} parameter
 * @param {number} valueNum
 * @param {string} baseFlag — 'NORMAL'|'LOW'|'HIGH'|'UNKNOWN'
 * @returns {string} — adjusted flag
 */
export function applyCriticalRule(parameter, valueNum, baseFlag) {
  if (typeof valueNum !== 'number' || !Number.isFinite(valueNum)) return baseFlag;

  const rule = findCriticalRule(parameter);
  if (!rule) return baseFlag;

  if (baseFlag === 'LOW' && rule.criticalLow != null && valueNum < rule.criticalLow) {
    return 'CRITICAL_LOW';
  }
  if (baseFlag === 'HIGH' && rule.criticalHigh != null && valueNum > rule.criticalHigh) {
    return 'CRITICAL_HIGH';
  }
  return baseFlag;
}
