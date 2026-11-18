import { AUTH_COOKIE_NAME, verifyAuthToken } from '../lib/authToken.js';
import { HttpError } from '../lib/httpError.js';
import { User } from '../models/index.js';

export async function requireAuth(req, _res, next) {
  const session = verifyAuthToken(req.cookies?.[AUTH_COOKIE_NAME]);
  if (!session) return next(HttpError.unauthorized());

  const user = await User.findById(session.userId);
  if (!user) return next(HttpError.unauthorized());

  // Changing or resetting the password signs out older sessions (JWT iat has 1s precision)
  const changedAt = user.passwordChangedAt?.getTime();
  if (changedAt && session.issuedAt.getTime() < Math.floor(changedAt / 1000) * 1000) {
    return next(HttpError.unauthorized('Session expired, please sign in again'));
  }

  req.user = user;
  return next();
}
