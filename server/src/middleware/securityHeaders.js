// A few response headers that cost nothing and close common holes.
import { env } from '../config/env.js';

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff'); // the browser must not guess file types
  res.setHeader('X-Frame-Options', 'DENY'); // nobody can embed the app in another site (clickjacking)
  res.setHeader('Referrer-Policy', 'same-origin');
  // The microphone is left alone on purpose: the voice button needs it.
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');

  // Browsers remember to use HTTPS only for 6 months. Only sent in production, where HTTPS exists.
  if (env.isProduction) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

  // Lead and price data must never be kept in a browser or proxy cache.
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');

  next();
}
