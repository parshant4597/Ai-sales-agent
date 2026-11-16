import mongoose from 'mongoose';
import { env } from './env.js';

// Fail fast instead of queueing queries when MongoDB is not connected.
mongoose.set('bufferCommands', false);

export async function connectDb() {
  if (!env.mongoUri) {
    console.warn('[db] MONGODB_URI is not set. The assistant works, but leads will not be saved.');
    return;
  }
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('[db] Connected to MongoDB');
  } catch (error) {
    console.error('[db] Could not connect to MongoDB:', error.message);
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
