import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { env } from '../src/config/env.js';
import { securityHeaders } from '../src/middleware/securityHeaders.js';

// Runs the middleware against a fake response and returns the headers it set.
function run(path, production) {
  const headers = {};
  const saved = env.isProduction;
  env.isProduction = production;
  let called = false;
  try {
    securityHeaders({ path }, { setHeader: (name, value) => (headers[name] = value) }, () => (called = true));
  } finally {
    env.isProduction = saved;
  }
  return { headers, called };
}

describe('security headers', () => {
  it('always blocks sniffing and framing, and calls next()', () => {
    const { headers, called } = run('/login', false);
    assert.equal(called, true);
    assert.equal(headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(headers['X-Frame-Options'], 'DENY');
    assert.equal(headers['Referrer-Policy'], 'same-origin');
  });

  it('keeps the microphone available for the voice button', () => {
    const { headers } = run('/', false);
    assert.ok(!headers['Permissions-Policy'].includes('microphone'));
  });

  it('sends HSTS only in production', () => {
    assert.equal(run('/', false).headers['Strict-Transport-Security'], undefined);
    assert.match(run('/', true).headers['Strict-Transport-Security'], /max-age=\d+/);
  });

  it('never caches API responses, but lets pages and assets cache', () => {
    assert.equal(run('/api/leads', false).headers['Cache-Control'], 'no-store');
    assert.equal(run('/leads', false).headers['Cache-Control'], undefined);
    assert.equal(run('/assets/index.js', false).headers['Cache-Control'], undefined);
  });
});
