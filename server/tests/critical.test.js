import { describe, it, expect } from 'vitest';
import { applyCriticalRule, findCriticalRule, CRITICAL_RULES } from '../src/lib/critical.js';

describe('Critical Value Rules', () => {
  it('has rules defined for critical lab parameters', () => {
    expect(CRITICAL_RULES.length).toBeGreaterThanOrEqual(10);
    const kRule = findCriticalRule('Potassium');
    expect(kRule).toBeDefined();
    expect(kRule.criticalHigh).toBe(6.5);
    expect(kRule.criticalLow).toBe(2.5);
  });

  describe('The two brief examples', () => {
    it('Haemoglobin 10.2 is LOW, NOT critical (threshold 7.0)', () => {
      // Hb 10.2 is below normal (12.0), but above critical low (7.0)
      const flag = applyCriticalRule('Haemoglobin', 10.2, 'LOW');
      expect(flag).toBe('LOW');
    });

    it('Potassium 6.8 is CRITICAL_HIGH (threshold 6.5)', () => {
      // Potassium 6.8 is above normal (5.1) and exceeds critical high (6.5)
      const flag = applyCriticalRule('Potassium', 6.8, 'HIGH');
      expect(flag).toBe('CRITICAL_HIGH');
    });
  });

  describe('Boundary and rule evaluations', () => {
    it('Potassium 6.5 exactly is HIGH, not critical (boundary)', () => {
      expect(applyCriticalRule('Potassium', 6.5, 'HIGH')).toBe('HIGH');
      expect(applyCriticalRule('Potassium', 6.51, 'HIGH')).toBe('CRITICAL_HIGH');
    });

    it('Potassium 2.5 is LOW, not critical (boundary)', () => {
      expect(applyCriticalRule('Potassium', 2.5, 'LOW')).toBe('LOW');
      expect(applyCriticalRule('Potassium', 2.49, 'LOW')).toBe('CRITICAL_LOW');
    });

    it('Haemoglobin 6.5 is CRITICAL_LOW', () => {
      expect(applyCriticalRule('Haemoglobin', 6.5, 'LOW')).toBe('CRITICAL_LOW');
    });

    it('Sodium 118 is CRITICAL_LOW (< 120)', () => {
      expect(applyCriticalRule('Sodium', 118, 'LOW')).toBe('CRITICAL_LOW');
    });

    it('Sodium 162 is CRITICAL_HIGH (> 160)', () => {
      expect(applyCriticalRule('Sodium', 162, 'HIGH')).toBe('CRITICAL_HIGH');
    });

    it('Fasting glucose 35 is CRITICAL_LOW (< 40)', () => {
      expect(applyCriticalRule('Fasting glucose', 35, 'LOW')).toBe('CRITICAL_LOW');
    });

    it('Fasting glucose 480 is CRITICAL_HIGH (> 450)', () => {
      expect(applyCriticalRule('Fasting glucose', 480, 'HIGH')).toBe('CRITICAL_HIGH');
    });

    it('Parameters with no critical rule keep their base flag', () => {
      expect(applyCriticalRule('Vitamin D', 12, 'LOW')).toBe('LOW');
      expect(applyCriticalRule('Total cholesterol', 250, 'HIGH')).toBe('HIGH');
    });

    it('NORMAL flags are not converted to critical', () => {
      expect(applyCriticalRule('Potassium', 4.5, 'NORMAL')).toBe('NORMAL');
    });
  });
});
