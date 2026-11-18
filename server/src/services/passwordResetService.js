import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import { sendMail } from '../lib/mailer.js';
import { User } from '../models/index.js';

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function resetEmail(name, link) {
  const text = [
    `Hi ${name},`,
    '',
    'We received a request to reset your Spendfetti password.',
    `Choose a new one here (valid for 30 minutes): ${link}`,
    '',
    'If you didn’t ask for this, you can ignore this email — your password stays the same.',
  ].join('\n');
  const html = `<p>Hi ${name},</p>
<p>We received a request to reset your Spendfetti password.</p>
<p><a href="${link}">Choose a new password</a> (valid for 30 minutes).</p>
<p>If you didn’t ask for this, you can ignore this email — your password stays the same.</p>`;
  return { subject: 'Reset your Spendfetti password', text, html };
}

/**
 * Emails a single-use reset link if the account exists. Callers respond the
 * same way either way so the endpoint can't be used to discover emails.
 */
export async function requestPasswordReset(email, now = new Date()) {
  const user = await User.findOne({ email });
  if (!user) return;

  const token = crypto.randomBytes(32).toString('base64url');
  user.passwordReset = {
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
  };
  await user.save();

  const link = `${env.CLIENT_ORIGIN}/reset-password?token=${token}`;
  await sendMail({ to: user.email, ...resetEmail(user.name, link) });
}

export async function resetPassword(token, newPassword, now = new Date()) {
  const user = await User.findOne({
    'passwordReset.tokenHash': hashToken(token),
    'passwordReset.expiresAt': { $gt: now },
  });
  if (!user) throw HttpError.badRequest('This reset link is invalid or has expired');

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.passwordReset = undefined;
  user.passwordChangedAt = now;
  await user.save();
}
