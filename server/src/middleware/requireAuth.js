import { AUTH_COOKIE_NAME, verifyAuthToken } from '../lib/authToken.js';
import { HttpError } from '../lib/httpError.js';
import { User } from '../models/index.js';

export async function requireAuth(req, _res, next) {
  const userId = verifyAuthToken(req.cookies?.[AUTH_COOKIE_NAME]);
  if (!userId) return next(HttpError.unauthorized());

  const user = await User.findById(userId);
  if (!user) return next(HttpError.unauthorized());

  req.user = user;
  return next();
}
