import { HttpError } from '../lib/httpError.js';

/**
 * Validates `req[source]` against a Zod schema and stores the parsed result on
 * `req.validated[source]` (Express 5 makes `req.query` read-only).
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(HttpError.badRequest('Validation failed', details));
    }
    req.validated = { ...req.validated, [source]: result.data };
    return next();
  };
}
