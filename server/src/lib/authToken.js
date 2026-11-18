import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'spendfetti_token';

const maxAgeMs = () => env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

export function signAuthToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRES_IN_DAYS}d`,
  });
}

/** Returns the user id from a valid token, or null. */
export function verifyAuthToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// API and client live on different domains in production (Render + Vercel),
// so the cookie must be SameSite=None; Secure there.
const cookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
});

/** `remember: false` issues a session cookie that ends when the browser closes. */
export function setAuthCookie(res, userId, { remember = true } = {}) {
  res.cookie(AUTH_COOKIE_NAME, signAuthToken(userId), {
    ...cookieOptions(),
    ...(remember && { maxAge: maxAgeMs() }),
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}
