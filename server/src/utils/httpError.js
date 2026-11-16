// An error that carries an HTTP status, so controllers can `throw` and the
// error middleware turns it into a clean JSON response.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const notFound = (message) => new HttpError(404, message);
export const unavailable = (message) => new HttpError(503, message);
