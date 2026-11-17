// Password hashing with scrypt, which is built into Node (no extra package).
// scrypt is deliberately slow and memory-hungry, so guessing passwords from a stolen
// database is expensive. Every password gets its own random salt.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const SALT_BYTES = 16;
const KEY_BYTES = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEY_BYTES);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, keyHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  // timingSafeEqual takes the same time however many bytes match, so the check leaks nothing.
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
