// Everything about team accounts: sign-in check, lookup for a session, and admin management.
import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.js';
import { env } from '../config/env.js';
import { MIN_PASSWORD_LENGTH } from '../constants.js';
import { User } from '../models/User.js';
import { badRequest, conflict, notFound, unavailable } from '../utils/httpError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

function requireDb() {
  if (!isDbConnected()) throw unavailable('Database is not connected. Check MONGODB_URI.');
}

// What the browser may see about a user. Never the hash.
export const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
});

let dummyHash;

/**
 * Checks an email and password. Returns the user, or null for a wrong email OR a wrong password
 * (the caller must not say which). An unknown email is still checked against a throwaway hash,
 * so the response time does not reveal which emails have an account.
 */
export async function authenticate(email, password) {
  requireDb();
  const user = await User.findOne({ email });

  dummyHash ??= await hashPassword('not-a-real-password');
  const passwordMatches = await verifyPassword(password, user ? user.passwordHash : dummyHash);
  if (!user || !passwordMatches) return null;

  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

// The user behind a valid token, or null if they were removed or their password changed since.
export async function findSessionUser(session) {
  requireDb();
  if (!mongoose.isValidObjectId(session.sub)) return null;

  const user = await User.findById(session.sub);
  if (!user || session.iat < user.passwordChangedAt.getTime()) return null;
  return user;
}

export async function listUsers() {
  requireDb();
  const users = await User.find().sort({ createdAt: 1 }).lean();
  return users.map(toPublicUser);
}

export async function createUser({ name, email, password, role }) {
  requireDb();
  // Checked here for a clear message; the unique index still guards against two requests racing.
  if (await User.exists({ email })) throw conflict('A team member with this email already exists.');
  try {
    const user = await User.create({ name, email, role, passwordHash: await hashPassword(password) });
    return toPublicUser(user);
  } catch (error) {
    if (error.code === 11000) throw conflict('A team member with this email already exists.');
    throw error;
  }
}

export async function resetPassword(id, password) {
  requireDb();
  const user = await User.findByIdAndUpdate(
    id,
    { passwordHash: await hashPassword(password), passwordChangedAt: new Date() }, // signs them out everywhere
    { new: true },
  );
  if (!user) throw notFound('Team member not found.');
  return toPublicUser(user);
}

export async function removeUser(id, actingUserId) {
  requireDb();
  if (id === actingUserId) throw badRequest("You can't remove your own account.");

  const user = await User.findById(id);
  if (!user) throw notFound('Team member not found.');
  if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
    throw badRequest('Keep at least one admin, or nobody can manage the team.');
  }
  await user.deleteOne();
}

// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if that account does not exist yet.
// It never changes an existing account, so a changed password is not undone on restart.
export async function seedAdminFromEnv() {
  if (!env.adminEmail || !env.adminPassword) return;
  if (env.adminPassword.length < MIN_PASSWORD_LENGTH) {
    console.warn(`[auth] ADMIN_PASSWORD is shorter than ${MIN_PASSWORD_LENGTH} characters, so no admin was created.`);
    return;
  }
  try {
    if (await User.exists({ email: env.adminEmail })) return;
    await createUser({ name: env.adminName, email: env.adminEmail, password: env.adminPassword, role: 'admin' });
    console.log(`[auth] Created the first admin account (${env.adminEmail}).`);
  } catch (error) {
    console.error('[auth] Could not create the admin account:', error.message);
  }
}
