import { describe, it, expect } from 'vitest';
import { parseCSV, validateRow, normalizeStatus } from '../src/services/import.js';
import { normalizeMobile } from '../src/lib/hashMobile.js';

describe('Import Pipeline Logic', () => {
  describe('normalizeMobile', () => {
    it('normalizes 10-digit Indian numbers starting with 6-9 to E.164', () => {
      expect(normalizeMobile('9000000001')).toBe('+919000000001');
      expect(normalizeMobile(' 9876543210 ')).toBe('+919876543210');
      expect(normalizeMobile('+919000000002')).toBe('+919000000002');
      expect(normalizeMobile('09000000003')).toBe('+919000000003');
    });

    it('rejects invalid numbers', () => {
      expect(normalizeMobile('12345')).toBeNull();
      expect(normalizeMobile('5000000001')).toBeNull(); // starts with 5
      expect(normalizeMobile('abcdefghij')).toBeNull();
      expect(normalizeMobile('')).toBeNull();
    });
  });

  describe('normalizeStatus', () => {
    it('normalizes Processing -> PROCESSING', () => {
      expect(normalizeStatus('Processing')).toBe('PROCESSING');
      expect(normalizeStatus('processing')).toBe('PROCESSING');
    });

    it('normalizes Ready, Signed, Ready (critical) -> SIGNED', () => {
      expect(normalizeStatus('Ready')).toBe('SIGNED');
      expect(normalizeStatus('Signed')).toBe('SIGNED');
      expect(normalizeStatus('Ready (critical)')).toBe('SIGNED');
      expect(normalizeStatus('ready (critical)')).toBe('SIGNED');
    });
  });

  describe('parseCSV & validateRow', () => {
    it('parses valid CSV headers case-insensitively', () => {
      const csv = `Order_ID,Patient_Name,Mobile,Sex,DOB,Parameter,Unit,Result,Reference_Range,Status,Referring_Doctor,Signed_At
ORD-71204,Lakshmi Prasanna K,9000000001,F,1978-04-12,Haemoglobin,g/dL,10.2,12.0-15.5,Ready,Dr. S. Ramanaiah,2026-11-01T10:15:00+05:30`;

      const rows = parseCSV(Buffer.from(csv));
      expect(rows).toHaveLength(1);
      expect(rows[0].order_id).toBe('ORD-71204');
      expect(rows[0].patient_name).toBe('Lakshmi Prasanna K');
    });

    it('validates a correct row successfully', () => {
      const row = {
        order_id: 'ORD-71204',
        patient_name: 'Lakshmi Prasanna K',
        mobile: '9000000001',
        sex: 'F',
        dob: '1978-04-12',
        parameter: 'Haemoglobin',
        unit: 'g/dL',
        result: '10.2',
        reference_range: '12.0-15.5',
        status: 'Ready',
        referring_doctor: 'Dr. S. Ramanaiah',
        signed_at: '2026-11-01T10:15:00+05:30',
      };

      const { valid, data, errors } = validateRow(row, 1);
      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
      expect(data.order_id).toBe('ORD-71204');
    });

    it('rejects rows missing required fields with detailed error messages', () => {
      const badRow = {
        order_id: '',
        patient_name: '',
        mobile: 'invalid',
        sex: 'X',
        parameter: 'Haemoglobin',
        result: '10.2',
      };

      const { valid, errors } = validateRow(badRow, 5);
      expect(valid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Row 5'))).toBe(true);
    });
  });
});

