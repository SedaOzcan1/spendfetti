import mongoose from 'mongoose';
import { HttpError } from '../lib/httpError.js';

export function notFoundHandler(_req, _res, next) {
  next(HttpError.notFound());
}

function normalizeError(err) {
  if (err instanceof HttpError) return err;
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return HttpError.badRequest('Validation failed', details);
  }
  if (err instanceof mongoose.Error.CastError) return HttpError.badRequest(`Invalid ${err.path}`);
  if (err?.code === 11000) return HttpError.conflict('Resource already exists');
  if (err?.type === 'entity.parse.failed') return HttpError.badRequest('Malformed JSON body');
  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const httpError = normalizeError(err);
  if (!httpError) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(httpError.status).json({
    error: httpError.message,
    ...(httpError.details && { details: httpError.details }),
  });
}
