import { connectDb, onDbConnected } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { isAiConfigured } from './services/ai.client.js';
import { assertAuthConfig } from './services/auth.service.js';
import { loadCatalogue } from './services/product.service.js';
import { seedAdminFromEnv } from './services/user.service.js';

assertAuthConfig(); // refuses to start in production without a real SESSION_SECRET

// Listen FIRST and connect to the database in the background. The port opens at once, so the
// browser, the Vite proxy and a host's health check never see "connection refused" while
// MongoDB is still handshaking. Until it connects, data routes answer "503 database not connected".
createApp().listen(env.port, () => {
  const mode = isAiConfigured() ? `AI on (${env.aiModel})` : 'AI off, rule-based mode';
  console.log(`[server] http://localhost:${env.port}  |  ${mode}`);
});

// As soon as the database is reachable (and again after any reconnect, harmlessly): create the first
// admin, and load the admin-managed price list into the catalogue the assistant quotes from.
onDbConnected(seedAdminFromEnv);
onDbConnected(loadCatalogue);
connectDb();
