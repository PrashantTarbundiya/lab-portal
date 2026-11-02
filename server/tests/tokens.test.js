import { describe, it, expect } from 'vitest';
import { generateToken, hashToken, constantTimeCompare, LINK_TTL_HOURS } from '../src/lib/tokens.js';

describe('Secure Link Tokens', () => {
  it('generates a 32-byte random token and sha256 hash', () => {
    const { raw, hash } = generateToken();
    expect(typeof raw).toBe('string');
    expect(raw.length).toBeGreaterThanOrEqual(40); // base64url of 32 bytes
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex is exactly 64 chars
    expect(hashToken(raw)).toBe(hash);
  });

  it('generates unique tokens on each invocation', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1.raw).not.toBe(t2.raw);
    expect(t1.hash).not.toBe(t2.hash);
  });

  it('constantTimeCompare securely compares token strings', () => {
    const h1 = hashToken('secret-token-1');
    const h2 = hashToken('secret-token-1');
    const h3 = hashToken('secret-token-2');

    expect(constantTimeCompare(h1, h2)).toBe(true);
    expect(constantTimeCompare(h1, h3)).toBe(false);
    expect(constantTimeCompare(h1, '')).toBe(false);
    expect(constantTimeCompare('', h1)).toBe(false);
  });

  it('LINK_TTL_HOURS defaults to 72 hours per specification', () => {
    expect(LINK_TTL_HOURS).toBe(72);
  });
});
