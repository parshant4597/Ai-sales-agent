import mongoose from 'mongoose';
import { env } from './env.js';

// Fail fast instead of queueing queries when MongoDB is not connected.
mongoose.set('bufferCommands', false);

const RETRY_AFTER_MS = 10 * 1000;

// With bufferCommands off, Mongoose skips its automatic index build at startup, so build the indexes
// here once connected. This is what makes "one account per email" (a unique index) actually hold.
async function createIndexes() {
  try {
    await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
  } catch (error) {
    console.error('[db] Could not create indexes (are there duplicate records?):', error.message);
  }
}

// Never throws. If the first attempt fails (Atlas asleep, Wi-Fi blip), it tries again until it
// works, so the app heals itself without a restart. After connecting, mongoose reconnects on its own.
export async function connectDb() {
  if (!env.mongoUri) {
    console.warn('[db] MONGODB_URI is not set. The assistant works, but leads will not be saved.');
    return;
  }
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('[db] Connected to MongoDB');
    await createIndexes();
  } catch (error) {
    console.error(`[db] Could not connect to MongoDB (${error.message}). Retrying in ${RETRY_AFTER_MS / 1000}s.`);
    setTimeout(connectDb, RETRY_AFTER_MS);
  }
}

// Runs `callback` every time the database connects (the first time and after any reconnect).
export function onDbConnected(callback) {
  mongoose.connection.on('connected', callback);
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
