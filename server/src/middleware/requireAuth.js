// Guards a route: only a signed-in team member gets through.
import { SESSION_COOKIE } from '../constants.js';
import { readSession } from '../services/auth.service.js';
import { findSessionUser } from '../services/user.service.js';
import { parseCookies } from '../utils/cookies.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

export async function requireAuth(req, res, next) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const session = token ? readSession(token) : null;
  if (!session) throw unauthorized('Please sign in.');

  // Looked up on every request, so removing a member or resetting a password takes effect at once.
  const user = await findSessionUser(session);
  if (!user) throw unauthorized('Your session has ended. Please sign in again.');

  req.user = user;
  next();
}

// Use after requireAuth, on routes only an admin may call.
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') throw forbidden('Only an admin can do this.');
  next();
}
