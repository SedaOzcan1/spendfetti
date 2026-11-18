import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { AUTH_COOKIE_NAME } from '../src/lib/authToken.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const app = createApp();
const credentials = { name: 'Ada', email: 'ada@example.com', password: 'correct-horse-1' };

const authCookie = (res) =>
  (res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));

describe('POST /api/auth/register', () => {
  it('creates a user and sets an httpOnly auth cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'ADA@example.com', city: 'Istanbul' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      city: 'Istanbul',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');

    const cookie = authCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
  });

  it('validates the payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(authCookie(res)).toBeDefined();
  });

  it.each([
    ['wrong password', { email: credentials.email, password: 'wrong-password' }],
    ['unknown email', { email: 'nobody@example.com', password: credentials.password }],
  ])('returns 401 for %s', async (_label, body) => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app).post('/api/auth/login').send(body);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
    expect(authCookie(res)).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${AUTH_COOKIE_NAME}=not.a.valid-token`);
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
    expect(authCookie(res)).toMatch(/Expires=Thu, 01 Jan 1970/);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('password rules', () => {
  it.each(['onlyletters', '12345678'])('rejects "%s"', async (password) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, password });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/auth/me', () => {
  it('updates profile and preferences', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.patch('/api/auth/me').send({
      name: 'Ada L.',
      city: 'Izmir',
      confettiEnabled: false,
      funBudgetPromptEnabled: false,
      funBudgetRatio: 0.3,
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Ada L.',
      city: 'Izmir',
      confettiEnabled: false,
      funBudgetPromptEnabled: false,
      funBudgetRatio: 0.3,
    });
  });

  it('ignores fields that are not editable (e.g. email)', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const res = await agent.patch('/api/auth/me').send({ name: 'Ada', email: 'evil@example.com' });
    expect(res.body.user.email).toBe(credentials.email);
  });

  it('validates the ratio', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);
    expect((await agent.patch('/api/auth/me').send({ funBudgetRatio: 2 })).status).toBe(400);
  });
});

describe('PUT /api/auth/password', () => {
  it('changes the password when the current one is correct', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);

    const wrong = await agent
      .put('/api/auth/password')
      .send({ currentPassword: 'nope', newPassword: 'brand-new-2' });
    expect(wrong.status).toBe(400);

    const ok = await agent
      .put('/api/auth/password')
      .send({ currentPassword: credentials.password, newPassword: 'brand-new-2' });
    expect(ok.status).toBe(204);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'brand-new-2' });
    expect(login.status).toBe(200);
    expect(login.body.user.lastLoginAt).toBeDefined();
  });
});

describe('remember me', () => {
  it('issues a session cookie when remember is false', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password, remember: false });

    expect(authCookie(res)).not.toMatch(/Max-Age|Expires/i);
  });
});
