import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { sentMails } from '../src/lib/mailer.js';
import { User } from '../src/models/index.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const app = createApp();
const credentials = { name: 'Ada', email: 'ada@example.com', password: 'correct-horse-1' };

beforeEach(async () => {
  sentMails.length = 0;
  await request(app).post('/api/auth/register').send(credentials);
});

const tokenFromMail = () => sentMails.at(-1).text.match(/token=([\w-]+)/)[1];
const login = (password) =>
  request(app).post('/api/auth/login').send({ email: credentials.email, password });

describe('password reset', () => {
  it('emails a reset link and lets the user choose a new password', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ADA@example.com' });
    expect(res.status).toBe(202);

    expect(sentMails).toHaveLength(1);
    expect(sentMails[0]).toMatchObject({
      to: 'ada@example.com',
      subject: 'Reset your Spendfetti password',
    });
    expect(sentMails[0].text).toContain('http://localhost:5173/reset-password?token=');

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenFromMail(), password: 'brand-new-2' });
    expect(reset.status).toBe(204);

    expect((await login('correct-horse-1')).status).toBe(401);
    expect((await login('brand-new-2')).status).toBe(200);
  });

  it('responds the same way for unknown emails (no account enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(202);
    expect(sentMails).toHaveLength(0);
  });

  it('stores only a hash of the token', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email });
    const user = await User.findOne({ email: credentials.email }).select('+passwordReset');
    expect(user.passwordReset.tokenHash).toMatch(/^[a-f\d]{64}$/);
    expect(user.passwordReset.tokenHash).not.toBe(tokenFromMail());
  });

  it('rejects reused, expired and unknown tokens', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email });
    const token = tokenFromMail();

    await request(app).post('/api/auth/reset-password').send({ token, password: 'brand-new-2' });
    const reused = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'another-one-3' });
    expect(reused.status).toBe(400);
    expect(reused.body.error).toBe('This reset link is invalid or has expired');

    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email });
    await User.updateOne(
      { email: credentials.email },
      { $set: { 'passwordReset.expiresAt': new Date(Date.now() - 1000) } },
    );
    const expired = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenFromMail(), password: 'brand-new-2' });
    expect(expired.status).toBe(400);

    const unknown = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'x'.repeat(43), password: 'brand-new-2' });
    expect(unknown.status).toBe(400);
  });

  it('enforces the password rules', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenFromMail(), password: 'short' });
    expect(res.status).toBe(400);
  });

  it('signs out existing sessions after a reset', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(credentials);
    // JWT iat has one-second precision
    await new Promise((resolve) => setTimeout(resolve, 1100));

    await request(app).post('/api/auth/forgot-password').send({ email: credentials.email });
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: tokenFromMail(), password: 'brand-new-2' });

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
    expect(me.body.error).toBe('Session expired, please sign in again');
  });
});

describe('change password sessions', () => {
  it('keeps the current device signed in but signs out others', async () => {
    const laptop = request.agent(app);
    const phone = request.agent(app);
    await laptop.post('/api/auth/login').send(credentials);
    await phone.post('/api/auth/login').send(credentials);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await laptop
      .put('/api/auth/password')
      .send({ currentPassword: credentials.password, newPassword: 'brand-new-2' });
    expect(res.status).toBe(204);

    expect((await laptop.get('/api/auth/me')).status).toBe(200);
    expect((await phone.get('/api/auth/me')).status).toBe(401);
  });
});
