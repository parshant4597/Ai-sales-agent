import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { isAiConfigured } from './services/ai.client.js';

await connectDb();

createApp().listen(env.port, () => {
  const mode = isAiConfigured() ? `AI on (${env.aiModel})` : 'AI off, rule-based mode';
  console.log(`[server] http://localhost:${env.port}  |  ${mode}`);
});
