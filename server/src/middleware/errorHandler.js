import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  const status = error.status || (error.type === 'entity.parse.failed' ? 400 : 500);
  // Expected errors (HttpError) are not bugs, so only unexpected ones get a stack trace.
  if (status >= 500 && !(error instanceof HttpError)) console.error('[error]', error);

  let message = status >= 500 && env.isProduction ? 'Something went wrong on the server.' : error.message;
  if (error.type === 'entity.parse.failed') message = 'The request body is not valid JSON.';
  if (error.type === 'entity.too.large') message = 'The request is too large.';
  res.status(status).json({ error: message });
}
