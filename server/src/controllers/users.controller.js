// Team management. Every route here is admin-only (see routes/index.js).
import { createUser, listUsers, removeUser, resetPassword } from '../services/user.service.js';
import { parseNewUser, parseObjectId, parsePassword } from '../validators/index.js';

// GET /api/users
export async function getUsers(req, res) {
  res.json({ users: await listUsers() });
}

// POST /api/users  { name, email, password, role? }
export async function postUser(req, res) {
  res.status(201).json({ user: await createUser(parseNewUser(req.body)) });
}

// PATCH /api/users/:id/password  { password }
export async function patchUserPassword(req, res) {
  const user = await resetPassword(parseObjectId(req.params.id), parsePassword(req.body?.password));
  res.json({ user });
}

// DELETE /api/users/:id
export async function deleteUser(req, res) {
  await removeUser(parseObjectId(req.params.id), String(req.user._id));
  res.json({ ok: true });
}
