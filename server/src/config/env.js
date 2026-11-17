// Reads environment variables once and exports them as a single object,
// so the rest of the code never touches process.env directly.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverRoot, '.env'), quiet: true });

export const env = {
  port: Number(process.env.PORT) || 5000,
  isProduction: process.env.NODE_ENV === 'production',

  mongoUri: process.env.MONGODB_URI || '',

  // Any OpenAI-compatible chat API works (Groq, OpenAI, Gemini's OpenAI endpoint...).
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: (process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  aiModel: process.env.AI_MODEL || 'openai/gpt-oss-120b',

  // Signs the login cookie. Required in production (32+ random characters).
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionDays: 7,

  // The first admin account, created on startup if it does not exist yet.
  // After that, the admin adds the rest of the team on the Team page.
  adminName: process.env.ADMIN_NAME || 'Admin',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',

  clientDistPath: path.resolve(serverRoot, '../client/dist'),
};
