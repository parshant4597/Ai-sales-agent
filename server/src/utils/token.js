// A signed login token: base64(payload) + "." + HMAC-SHA256(payload, secret).
// Anyone can read the payload, but nobody can change it (or invent a token) without the secret.
import crypto from 'node:crypto';

const sign = (payload, secret) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');

export function createToken(userId, { secret, ttlMs, now = Date.now() }) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, iat: now, exp: now + ttlMs })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns { sub, iat, exp } for a genuine, unexpired token, otherwise null. */
export function verifyToken(token, { secret, now = Date.now() }) {
  const [payload, signature, ...extra] = String(token).split('.');
  if (!payload || !signature || extra.length > 0) return null;

  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.sub === 'string' && data.exp > now ? data : null;
  } catch {
    return null;
  }
}
