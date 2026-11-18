import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { clearAuthCookie, setAuthCookie } from '../lib/authToken.js';
import { HttpError } from '../lib/httpError.js';
import { User } from '../models/index.js';

const BCRYPT_ROUNDS = 12;

// bcrypt only uses the first 72 bytes of a password
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(72);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase().max(254),
  password: passwordSchema,
  city: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(72),
});

export async function register(req, res) {
  const { name, email, password, city } = req.validated.body;

  if (await User.exists({ email })) {
    throw HttpError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, city });

  setAuthCookie(res, user._id);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!isValid) throw HttpError.unauthorized('Invalid email or password');

  setAuthCookie(res, user._id);
  res.json({ user });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user });
}
