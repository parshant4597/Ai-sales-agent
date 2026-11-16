// Optional protection for the deployed demo: when APP_PASSWORD is set, the
// browser asks for a username and that password (HTTP Basic Auth).
import crypto from 'node:crypto';
import { env } from '../config/env.js';

function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function basicAuth(req, res, next) {
  if (!env.appPassword || req.path === '/api/health') return next();

  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const password = decoded.slice(decoded.indexOf(':') + 1);
    if (safeEqual(password, env.appPassword)) return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Remedy Setu Sales Assistant"');
  return res.status(401).send('Login required');
}
