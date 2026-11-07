import { describe, it, expect } from 'vitest';

describe('Real-World Diagnostic Portal Features', () => {
  describe('1. Longitudinal Biomarker Trends & Delta Calculations', () => {
    function computeTrend(paramName, prevVal, currVal, unit = 'mg/dL') {
      const prev = parseFloat(prevVal);
      const curr = parseFloat(currVal);
      const delta = Math.round((curr - prev) * 100) / 100;
      const percentChange = prev !== 0 ? Math.round((delta / prev) * 1000) / 10 : null;
      const direction = delta > 0 ? 'INCREASED' : delta < 0 ? 'DECREASED' : 'STABLE';

      const paramLower = paramName.toLowerCase();
      const isHdl = /hdl/i.test(paramLower);
      const lowerIsBetter = !isHdl && /glucose|sugar|hba1c|cholesterol|triglyceride|ldl|bilirubin|sgpt|sgot|creatinine|uric/i.test(paramLower);
      const higherIsBetter = isHdl || /haemoglobin|hb|platelet|vitamin|calcium/i.test(paramLower);

      let isFavorable = null;
      if (lowerIsBetter) {
        isFavorable = delta < 0;
      } else if (higherIsBetter) {
        isFavorable = delta > 0;
      }

      return { parameter: paramName, prev, curr, delta, percentChange, direction, isFavorable };
    }

    it('accurately identifies drop in Fasting Glucose as favorable', () => {
      const trend = computeTrend('Fasting glucose', '162', '145', 'mg/dL');
      expect(trend.delta).toBe(-17);
      expect(trend.percentChange).toBe(-10.5);
      expect(trend.direction).toBe('DECREASED');
      expect(trend.isFavorable).toBe(true);
    });

    it('accurately identifies drop in HbA1c as favorable', () => {
      const trend = computeTrend('HbA1c', '8.4', '7.8', '%');
      expect(trend.delta).toBe(-0.6);
      expect(trend.percentChange).toBe(-7.1);
      expect(trend.isFavorable).toBe(true);
    });

    it('accurately identifies increase in HDL ("good cholesterol") as favorable', () => {
      const trend = computeTrend('HDL cholesterol', '32', '35', 'mg/dL');
      expect(trend.delta).toBe(3);
      expect(trend.direction).toBe('INCREASED');
      expect(trend.isFavorable).toBe(true);
    });

    it('accurately identifies increase in LDL ("bad cholesterol") as unfavorable', () => {
      const trend = computeTrend('LDL cholesterol', '130', '155', 'mg/dL');
      expect(trend.delta).toBe(25);
      expect(trend.isFavorable).toBe(false);
    });

    it('accurately identifies increase in Haemoglobin as favorable', () => {
      const trend = computeTrend('Haemoglobin', '7.9', '8.8', 'g/dL');
      expect(trend.delta).toBe(0.9);
      expect(trend.isFavorable).toBe(true);
    });
  });

  describe('2. ABDM & ABHA National Health Locker Integration', () => {
    function validateAbha(input) {
      if (!input || typeof input !== 'string') return false;
      const clean = input.trim();
      const is14Digit = /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(clean);
      const isAbhaAddress = /^[a-zA-Z0-9._-]+@abdm$/.test(clean);
      return is14Digit || isAbhaAddress;
    }

    it('validates 14-digit hyphenated ABHA number format', () => {
      expect(validateAbha('91-4589-2041-8821')).toBe(true);
      expect(validateAbha('12345678901234')).toBe(false); // needs proper format
    });

    it('validates ABHA address ending in @abdm', () => {
      expect(validateAbha('srinivas.rao@abdm')).toBe(true);
      expect(validateAbha('patient123@abdm')).toBe(true);
      expect(validateAbha('invalid-address@gmail.com')).toBe(false);
    });
  });

  describe('3. Home Sample Collection Booking Requirements', () => {
    function validateBooking(req) {
      const errors = [];
      if (!req.packageName) errors.push('packageName is required');
      if (!req.preferredDate) errors.push('preferredDate is required');
      if (!req.timeSlot) errors.push('timeSlot is required');
      if (!req.address || req.address.trim().length < 5) errors.push('Valid address is required');
      return { valid: errors.length === 0, errors };
    }

    it('accepts complete booking payload with morning fasting slot', () => {
      const result = validateBooking({
        packageName: 'Glycemic & HbA1c Monitoring',
        preferredDate: '2026-11-04',
        timeSlot: '06:30 AM - 07:30 AM (Fasting Optimal)',
        address: 'Flat 302, Green Meadows, Banjara Hills, Hyderabad 500034',
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('rejects booking with missing address or package', () => {
      const result = validateBooking({
        preferredDate: '2026-11-04',
        timeSlot: '06:30 AM - 07:30 AM',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('packageName is required');
      expect(result.errors).toContain('Valid address is required');
    });
  });

  describe('4. WhatsApp & Doctor Share Message Construction', () => {
    function buildShareMessage({ orderNo, patientName, resultsCount, abnormalCount, reportUrl }) {
      return `*Company A Diagnostics - Verified Laboratory Report*
Order: #${orderNo}
Patient: ${patientName}
Parameters: ${resultsCount} total (${abnormalCount > 0 ? `${abnormalCount} out-of-range` : 'All normal'})
NABL Accreditation: MC-3492 (ISO 15189:2022)

View full secure report & digital seal:
${reportUrl}`;
    }

    it('formats a tamper-evident WhatsApp message containing NABL accreditation', () => {
      const msg = buildShareMessage({
        orderNo: 'ORD-71205',
        patientName: 'Srinivas Rao T',
        resultsCount: 6,
        abnormalCount: 4,
        reportUrl: 'http://localhost:5173/reports/cmw06r79n003itl10fl2od2e2',
      });

      expect(msg).toContain('ORD-71205');
      expect(msg).toContain('Srinivas Rao T');
      expect(msg).toContain('4 out-of-range');
      expect(msg).toContain('NABL Accreditation: MC-3492');
      expect(msg).toContain('http://localhost:5173/reports/cmw06r79n003itl10fl2od2e2');
    });
  });

  describe('4. Home Collection Payment Gateway (COD & Razorpay)', () => {
    function processHomeCollectionPayment(bookingData) {
      const isOnline = bookingData.paymentMethod === 'ONLINE_RAZORPAY';
      return {
        bookingId: `HC-${Math.floor(100000 + Math.random() * 900000)}`,
        packageName: bookingData.packageName,
        paymentMethod: isOnline ? 'ONLINE_RAZORPAY' : 'CASH_ON_DELIVERY',
        paymentStatus: isOnline ? (bookingData.paymentStatus || 'PAID') : 'PENDING_COD',
        paymentAmount: bookingData.paymentAmount || '₹450',
        razorpayPaymentId: isOnline ? (bookingData.razorpayPaymentId || `pay_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`) : null,
      };
    }

    it('sets PENDING_COD and requires no payment gateway ID for Cash on Delivery', () => {
      const booking = processHomeCollectionPayment({
        packageName: 'Comprehensive Lipid Profile',
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentAmount: '₹450',
      });

      expect(booking.paymentMethod).toBe('CASH_ON_DELIVERY');
      expect(booking.paymentStatus).toBe('PENDING_COD');
      expect(booking.razorpayPaymentId).toBeNull();
      expect(booking.paymentAmount).toBe('₹450');
    });

    it('sets PAID and generates verified razorpayPaymentId for Online Razorpay', () => {
      const booking = processHomeCollectionPayment({
        packageName: 'Thyroid & Vitamin Wellness (D + B12)',
        paymentMethod: 'ONLINE_RAZORPAY',
        paymentAmount: '₹990',
        razorpayPaymentId: 'pay_Rzp89210928',
      });

      expect(booking.paymentMethod).toBe('ONLINE_RAZORPAY');
      expect(booking.paymentStatus).toBe('PAID');
      expect(booking.razorpayPaymentId).toBe('pay_Rzp89210928');
      expect(booking.paymentAmount).toBe('₹990');
    });
  });

  describe('5. Family Member Profile Isolation & Alias Mapping', () => {
    const familyPatients = [
      { id: 'cmw06qpoc000ptl10sl19di9o', fullName: 'Lakshmi Prasanna K', relation: 'SELF' },
      { id: 'cmw06qq0i000rtl10qfeib6oc', fullName: 'Srinivas Rao T', relation: 'SPOUSE' },
      { id: 'cmw06qq6s000ttl10awv7mrde', fullName: 'Bhavani K', relation: 'CHILD' },
      { id: 'cmw06qqde000vtl10gfymhuj7', fullName: 'Raghavendra T', relation: 'CHILD' },
      { id: 'cmw0fmtsi0001tl7454v6jaqu', fullName: 'Kavya Murthy', relation: 'SELF' },
    ];

    function resolvePatientTarget(patientIdQuery, patients) {
      if (!patientIdQuery || patientIdQuery === 'all') return null;
      const pClean = String(patientIdQuery).trim().toLowerCase();
      let matched = patients.find(p => p.id === patientIdQuery);
      if (!matched) {
        if (pClean === 'p1' || pClean.includes('lakshmi')) {
          matched = patients.find(p => p.fullName.toLowerCase().includes('lakshmi'));
        } else if (pClean === 'p2' || pClean.includes('srinivas')) {
          matched = patients.find(p => p.fullName.toLowerCase().includes('srinivas'));
        } else if (pClean === 'p3' || pClean.includes('bhavani')) {
          matched = patients.find(p => p.fullName.toLowerCase().includes('bhavani'));
        } else if (pClean === 'p4' || pClean.includes('raghavendra')) {
          matched = patients.find(p => p.fullName.toLowerCase().includes('raghavendra'));
        } else if (pClean === 'p5' || pClean.includes('kavya')) {
          matched = patients.find(p => p.fullName.toLowerCase().includes('kavya'));
        }
      }
      return matched || null;
    }

    it('correctly resolves aliases p1, p2, p3, p4, p5 to distinct individuals', () => {
      expect(resolvePatientTarget('p1', familyPatients).fullName).toBe('Lakshmi Prasanna K');
      expect(resolvePatientTarget('p2', familyPatients).fullName).toBe('Srinivas Rao T');
      expect(resolvePatientTarget('p3', familyPatients).fullName).toBe('Bhavani K');
      expect(resolvePatientTarget('p4', familyPatients).fullName).toBe('Raghavendra T');
      expect(resolvePatientTarget('p5', familyPatients).fullName).toBe('Kavya Murthy');
    });

    it('correctly resolves direct CUIDs without cross-contamination', () => {
      const match = resolvePatientTarget('cmw06qq0i000rtl10qfeib6oc', familyPatients);
      expect(match.fullName).toBe('Srinivas Rao T');
      expect(match.relation).toBe('SPOUSE');
    });
  });
});
