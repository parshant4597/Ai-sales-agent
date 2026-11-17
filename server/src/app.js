import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // correct client IPs behind Render / Railway for the rate limiter
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', routes);
  app.use('/api', notFoundHandler);

  // In production the same server also serves the built React app.
  const indexHtml = path.join(env.clientDistPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(env.clientDistPath));
    app.use((req, res) => res.sendFile(indexHtml));
  }

  app.use(errorHandler);
  return app;
}
