// Login sessions: a signed token kept in an HttpOnly cookie, so page scripts can never read it.
import { env } from '../config/env.js';
import { SESSION_COOKIE } from '../constants.js';
import { serializeCookie } from '../utils/cookies.js';
import { createToken, verifyToken } from '../utils/token.js';

const DAY_SECONDS = 24 * 60 * 60;
const DEV_SECRET = 'dev-only-secret-never-use-this-in-production';

const secret = () => env.sessionSecret || DEV_SECRET;

// Call once at startup. Production without a real secret would let anyone forge a login.
export function assertAuthConfig() {
  if (env.isProduction && env.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 random characters in production.');
  }
  if (!env.sessionSecret) console.warn('[auth] SESSION_SECRET is not set: using an insecure development secret.');
}

export function issueSessionCookie(user) {
  const token = createToken(String(user._id), { secret: secret(), ttlMs: env.sessionDays * DAY_SECONDS * 1000 });
  return serializeCookie(SESSION_COOKIE, token, { maxAgeSeconds: env.sessionDays * DAY_SECONDS, secure: env.isProduction });
}

export const clearSessionCookie = () => serializeCookie(SESSION_COOKIE, '', { maxAgeSeconds: 0, secure: env.isProduction });

export const readSession = (token) => verifyToken(token, { secret: secret() });
