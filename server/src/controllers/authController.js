import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { clearAuthCookie, setAuthCookie } from '../lib/authToken.js';
import { HttpError } from '../lib/httpError.js';
import { User } from '../models/index.js';
import { notifyWelcome } from '../services/notificationService.js';
import { requestPasswordReset, resetPassword } from '../services/passwordResetService.js';

const BCRYPT_ROUNDS = 12;

// bcrypt only uses the first 72 bytes of a password
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72)
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase().max(254),
  password: passwordSchema,
  city: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(72),
  remember: z.boolean().default(true),
});

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    city: z.string().trim().max(80),
    currency: z.string().trim().length(3).toUpperCase(),
    confettiEnabled: z.boolean(),
    funBudgetPromptEnabled: z.boolean(),
    funBudgetRatio: z.number().min(0.01).max(1),
    savingsRatio: z.number().min(0).max(1),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: z.email().trim().toLowerCase() });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});

export async function register(req, res) {
  const { name, email, password, city } = req.validated.body;

  if (await User.exists({ email })) {
    throw HttpError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, city, lastLoginAt: new Date() });
  await notifyWelcome(user._id);

  setAuthCookie(res, user._id);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const { email, password, remember } = req.validated.body;
  const user = await User.findOne({ email }).select('+passwordHash');

  const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!isValid) throw HttpError.unauthorized('Invalid email or password');

  user.lastLoginAt = new Date();
  await user.save();

  setAuthCookie(res, user._id, { remember });
  res.json({ user });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user });
}

export async function updateMe(req, res) {
  req.user.set(req.validated.body);
  await req.user.save();
  res.json({ user: req.user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.validated.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw HttpError.badRequest('Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  await user.save();

  // Other devices are signed out; keep this one signed in with a fresh token
  setAuthCookie(res, user._id);
  res.status(204).end();
}

export async function forgotPassword(req, res) {
  await requestPasswordReset(req.validated.body.email);
  res.status(202).json({
    message: 'If an account exists for this email, we’ve sent a link to reset the password.',
  });
}

export async function completePasswordReset(req, res) {
  const { token, password } = req.validated.body;
  await resetPassword(token, password);
  clearAuthCookie(res);
  res.status(204).end();
}
