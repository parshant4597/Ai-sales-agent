import { clearSessionCookie, issueSessionCookie } from '../services/auth.service.js';
import { authenticate, toPublicUser } from '../services/user.service.js';
import { unauthorized } from '../utils/httpError.js';
import { parseLoginBody } from '../validators/index.js';

// POST /api/auth/login  { email, password }
export async function login(req, res) {
  const { email, password } = parseLoginBody(req.body);

  const user = await authenticate(email, password);
  // One message for both "no such email" and "wrong password", so nobody can probe for accounts.
  if (!user) throw unauthorized('Incorrect email or password.');

  res.setHeader('Set-Cookie', issueSessionCookie(user));
  res.json({ user: toPublicUser(user) });
}

// POST /api/auth/logout
export function logout(req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie());
  res.json({ ok: true });
}

// GET /api/auth/me : who is signed in? (used by the app on every page load)
export function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}
