/**
 * CSRF origin check middleware.
 * Validates the Origin header on state-changing requests.
 */
export function csrfCheck(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    if (!origin) return next();

    const rawOrigins = process.env.APP_BASE_URL || 'http://localhost:5173';
    const allowedOrigins = rawOrigins.split(',').map((s) => s.trim().replace(/\/+$/, ''));

    const isAllowed =
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin) ||
      process.env.NODE_ENV !== 'production' ||
      process.env.OTP_DEMO_MODE === 'true';

    if (!isAllowed) {
      console.warn(`[CSRF] Blocked request from untrusted origin: ${origin}`);
      return res.status(403).json({ error: 'CSRF check failed' });
    }
  }
  next();
}
