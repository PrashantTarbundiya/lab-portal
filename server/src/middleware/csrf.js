/**
 * Simple CSRF origin check middleware.
 * Validates the Origin header on state-changing requests.
 */
export function csrfCheck(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    const allowed = process.env.APP_BASE_URL || 'http://localhost:5173';
    if (origin && origin !== allowed) {
      return res.status(403).json({ error: 'CSRF check failed' });
    }
  }
  next();
}
