import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import { env } from '../src/config/env.js';
import { requireAdmin, requireAuth } from '../src/middleware/requireAuth.js';
import { assertAuthConfig, clearSessionCookie } from '../src/services/auth.service.js';
import { parseCookies, serializeCookie } from '../src/utils/cookies.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import { createToken, verifyToken } from '../src/utils/token.js';
import { parseLoginBody, parseNewUser, parsePassword } from '../src/validators/index.js';

const options = { secret: 'a-test-secret-with-enough-length-123456', ttlMs: 60_000 };

describe('password hashing', () => {
  it('accepts the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse battery');
    assert.equal(await verifyPassword('correct horse battery', stored), true);
    assert.equal(await verifyPassword('correct horse batterx', stored), false);
    assert.equal(await verifyPassword('', stored), false);
  });

  it('never stores the password and salts every hash differently', async () => {
    const first = await hashPassword('same-password');
    const second = await hashPassword('same-password');
    assert.ok(first.startsWith('scrypt$'));
    assert.ok(!first.includes('same-password'));
    assert.notEqual(first, second);
  });

  it('rejects a malformed stored hash instead of crashing', async () => {
    for (const stored of ['', 'plain', 'scrypt$', 'bcrypt$aa$bb', undefined, null]) {
      assert.equal(await verifyPassword('x', stored), false, String(stored));
    }
  });
});

describe('signed tokens', () => {
  it('round-trips a valid token', () => {
    const token = createToken('user-1', { ...options, now: 1000 });
    const data = verifyToken(token, { secret: options.secret, now: 2000 });
    assert.equal(data.sub, 'user-1');
    assert.equal(data.iat, 1000);
  });

  it('rejects an expired token', () => {
    const token = createToken('user-1', { ...options, now: 1000 });
    assert.equal(verifyToken(token, { secret: options.secret, now: 1000 + 60_000 + 1 }), null);
  });

  it('rejects a token signed with another secret', () => {
    const token = createToken('user-1', options);
    assert.equal(verifyToken(token, { secret: 'a-different-secret-entirely-0000000000' }), null);
  });

  it('rejects a token whose payload was edited (e.g. changing the user id)', () => {
    const [payload, signature] = createToken('user-1', options).split('.');
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), sub: 'admin' })).toString('base64url');
    assert.equal(verifyToken(`${forged}.${signature}`, options), null);
  });

  it('rejects garbage of every shape', () => {
    for (const token of ['', 'abc', 'a.b', 'a.b.c', '.', '..', 'x'.repeat(5000), undefined, null, {}]) {
      assert.equal(verifyToken(token, options), null, String(token));
    }
  });

  it('rejects a correctly signed payload that is not a token', () => {
    const payload = Buffer.from('not json').toString('base64url');
    const signature = createHmac('sha256', options.secret).update(payload).digest('base64url');
    assert.equal(verifyToken(`${payload}.${signature}`, options), null);
  });
});

describe('cookies', () => {
  it('parses a cookie header', () => {
    assert.deepEqual(parseCookies('a=1; remedy_session=abc%2Edef; theme=dark'), { a: '1', remedy_session: 'abc.def', theme: 'dark' });
  });
  it('ignores empty and broken cookies', () => {
    assert.deepEqual(parseCookies(undefined), {});
    assert.deepEqual(parseCookies('; =x; ok=1; bad=%E0%A4%A'), { ok: '1' });
  });
  it('builds a session cookie that scripts cannot read and other sites cannot send', () => {
    const cookie = serializeCookie('s', 'v', { maxAgeSeconds: 60, secure: true });
    for (const part of ['HttpOnly', 'SameSite=Lax', 'Secure', 'Max-Age=60', 'Path=/']) assert.ok(cookie.includes(part), part);
  });
  it('clears the cookie on sign-out', () => {
    assert.match(clearSessionCookie(), /Max-Age=0/);
  });
});

describe('login and user validation', () => {
  it('normalises the email and requires a password', () => {
    assert.deepEqual(parseLoginBody({ email: '  Admin@Team.COM ', password: 'x' }), { email: 'admin@team.com', password: 'x' });
    for (const body of [{}, { email: 'a@b.c' }, { email: 'a@b.c', password: '' }, { email: 'nope', password: 'x' }, { email: 'a@b.c', password: 5 }, { email: ['a@b.c'], password: 'x' }, undefined]) {
      assert.throws(() => parseLoginBody(body), undefined, JSON.stringify(body));
    }
  });

  it('enforces the password length for new passwords', () => {
    assert.equal(parsePassword('12345678'), '12345678');
    for (const password of ['1234567', '', 'a'.repeat(101), 12345678, null]) assert.throws(() => parsePassword(password), /Password must be/);
  });

  it('builds a new team member, defaulting to the member role', () => {
    const user = parseNewUser({ name: ' Priya ', email: 'Priya@Team.com', password: 'longenough1' });
    assert.deepEqual(user, { name: 'Priya', email: 'priya@team.com', password: 'longenough1', role: 'member' });
    assert.equal(parseNewUser({ name: 'A', email: 'a@b.c', password: 'longenough1', role: 'admin' }).role, 'admin');
  });

  it('rejects a bad role, name or email', () => {
    const good = { name: 'A', email: 'a@b.c', password: 'longenough1' };
    assert.throws(() => parseNewUser({ ...good, role: 'superuser' }), /Role must be/);
    assert.throws(() => parseNewUser({ ...good, name: '  ' }), /Name is required/);
    assert.throws(() => parseNewUser({ ...good, email: 'x' }), /valid email/);
  });
});

describe('route guards', () => {
  const next = () => assert.fail('next() must not be called for a blocked request');

  it('blocks a request with no cookie', async () => {
    await assert.rejects(requireAuth({ headers: {} }, {}, next), (error) => error.status === 401);
  });

  it('blocks a forged or expired cookie without touching the database', async () => {
    for (const cookie of ['remedy_session=forged.token', 'remedy_session=', 'other=1', 'remedy_session=a.b.c']) {
      await assert.rejects(requireAuth({ headers: { cookie } }, {}, next), (error) => error.status === 401, cookie);
    }
  });

  it('lets only an admin through requireAdmin', () => {
    let called = false;
    requireAdmin({ user: { role: 'admin' } }, {}, () => (called = true));
    assert.equal(called, true);
    assert.throws(() => requireAdmin({ user: { role: 'member' } }, {}, next), (error) => error.status === 403);
  });
});

describe('startup config', () => {
  it('refuses to run in production without a strong session secret', () => {
    const saved = { isProduction: env.isProduction, sessionSecret: env.sessionSecret };
    try {
      env.isProduction = true;
      env.sessionSecret = 'too-short';
      assert.throws(() => assertAuthConfig(), /SESSION_SECRET/);
      env.sessionSecret = 'x'.repeat(32);
      assert.doesNotThrow(() => assertAuthConfig());
    } finally {
      Object.assign(env, saved);
    }
  });
});
