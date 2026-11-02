import { describe, it, expect } from 'vitest';
import { maskPhone, maskName, maskPhonePartial } from '../src/lib/mask.js';

describe('Masking Utilities', () => {
  describe('maskPhone', () => {
    it('masks phone showing only the last 4 digits', () => {
      expect(maskPhone('+919000000001')).toBe('••••••0001');
      expect(maskPhone('9876543210')).toBe('••••••3210');
    });

    it('handles short or empty inputs gracefully', () => {
      expect(maskPhone('')).toBe('••••••••••');
      expect(maskPhone(null)).toBe('••••••••••');
      expect(maskPhone('123')).toBe('••••••••••');
    });
  });

  describe('maskName', () => {
    it('masks name as initials', () => {
      expect(maskName('Lakshmi Prasanna K')).toBe('L.P.K');
      expect(maskName('Venkata Rao M')).toBe('V.R.M');
      expect(maskName('Farzana Begum')).toBe('F.B');
      expect(maskName('Single')).toBe('S');
    });

    it('handles empty or invalid inputs', () => {
      expect(maskName('')).toBe('•');
      expect(maskName(null)).toBe('•');
    });
  });

  describe('maskPhonePartial', () => {
    it('masks phone for OTP gate showing last 4 digits', () => {
      expect(maskPhonePartial('+919000000001')).toBe('••••0001');
      expect(maskPhonePartial('9876543210')).toBe('••••3210');
    });
  });
});
