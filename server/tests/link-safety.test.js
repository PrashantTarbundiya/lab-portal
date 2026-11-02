import { describe, it, expect } from 'vitest';
import { buildReportMessage } from '../src/services/messaging.js';
import { maskPhonePartial } from '../src/lib/mask.js';

describe('Link Safety & Data Leak Prevention', () => {
  it('notification message contains NO patient name or test name', () => {
    const url = 'https://portal.companya.local/r/sample-token-123';
    const labName = 'Company A Diagnostics';

    const msgEn = buildReportMessage({ labName, url, lang: 'en' });
    const msgTe = buildReportMessage({ labName, url, lang: 'te' });
    const msgHi = buildReportMessage({ labName, url, lang: 'hi' });

    for (const msg of [msgEn, msgTe, msgHi]) {
      // Must contain URL and lab name
      expect(msg).toContain(url);
      expect(msg).toContain(labName);

      // Must NOT contain personal identifiers
      expect(msg).not.toContain('Lakshmi');
      expect(msg).not.toContain('Farzana');
      expect(msg).not.toContain('Haemoglobin');
      expect(msg).not.toContain('Potassium');
      expect(msg).not.toContain('LDL');

      // Must mention OTP and "Not for me" option
      expect(msg.toLowerCase()).toMatch(/otp/);
    }
  });

  it('landing gate display only exposes last 4 digits of phone', () => {
    const masked = maskPhonePartial('+919000000001');
    expect(masked).toBe('••••0001');
    expect(masked).not.toContain('900000');
  });
});
