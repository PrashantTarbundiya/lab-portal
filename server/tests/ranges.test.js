import { describe, it, expect } from 'vitest';
import { parseRange, computeFlag, parseNumericValue } from '../src/lib/ranges.js';

describe('Range Parsing and Flag Computation', () => {
  describe('parseNumericValue', () => {
    it('parses valid integers and decimals', () => {
      expect(parseNumericValue('10.2')).toBe(10.2);
      expect(parseNumericValue(' 142 ')).toBe(142);
      expect(parseNumericValue('0.9')).toBe(0.9);
    });

    it('returns null for non-numeric strings', () => {
      expect(parseNumericValue('Positive')).toBeNull();
      expect(parseNumericValue('Negative')).toBeNull();
      expect(parseNumericValue('N/A')).toBeNull();
      expect(parseNumericValue('')).toBeNull();
      expect(parseNumericValue(null)).toBeNull();
    });
  });

  describe('parseRange', () => {
    it('parses standard range "a-b"', () => {
      expect(parseRange('12.0-15.5')).toEqual({ op: 'RANGE', low: 12.0, high: 15.5 });
      expect(parseRange('70 - 100')).toEqual({ op: 'RANGE', low: 70, high: 100 });
    });

    it('handles en-dash and em-dash "a–b"', () => {
      expect(parseRange('3.5–5.1')).toEqual({ op: 'RANGE', low: 3.5, high: 5.1 });
      expect(parseRange('136—145')).toEqual({ op: 'RANGE', low: 136, high: 145 });
    });

    it('parses less-than expressions', () => {
      expect(parseRange('<5.7')).toEqual({ op: 'LT', high: 5.7 });
      expect(parseRange('<= 200')).toEqual({ op: 'LTE', high: 200 });
    });

    it('parses greater-than expressions', () => {
      expect(parseRange('>40')).toEqual({ op: 'GT', low: 40 });
      expect(parseRange('>= 150')).toEqual({ op: 'GTE', low: 150 });
    });

    it('returns null for unparseable strings', () => {
      expect(parseRange('not-a-range')).toBeNull();
      expect(parseRange('N/A')).toBeNull();
      expect(parseRange('')).toBeNull();
      expect(parseRange(null)).toBeNull();
    });
  });

  describe('computeFlag', () => {
    const range1 = { op: 'RANGE', low: 12.0, high: 15.5 };

    it('flags below low as LOW', () => {
      expect(computeFlag(10.2, range1)).toBe('LOW');
    });

    it('flags above high as HIGH', () => {
      expect(computeFlag(16.0, range1)).toBe('HIGH');
    });

    it('flags boundary values as NORMAL', () => {
      expect(computeFlag(12.0, range1)).toBe('NORMAL');
      expect(computeFlag(15.5, range1)).toBe('NORMAL');
      expect(computeFlag(13.5, range1)).toBe('NORMAL');
    });

    it('evaluates LT / LTE ranges correctly', () => {
      const ltRange = { op: 'LT', high: 5.7 };
      expect(computeFlag(5.2, ltRange)).toBe('NORMAL');
      expect(computeFlag(5.7, ltRange)).toBe('NORMAL'); // boundary considered normal
      expect(computeFlag(7.8, ltRange)).toBe('HIGH');
    });

    it('evaluates GT / GTE ranges correctly', () => {
      const gtRange = { op: 'GT', low: 40 };
      expect(computeFlag(45, gtRange)).toBe('NORMAL');
      expect(computeFlag(40, gtRange)).toBe('NORMAL');
      expect(computeFlag(35, gtRange)).toBe('LOW');
    });

    it('returns UNKNOWN for null or invalid inputs', () => {
      expect(computeFlag(null, range1)).toBe('UNKNOWN');
      expect(computeFlag(10.2, null)).toBe('UNKNOWN');
    });
  });
});
