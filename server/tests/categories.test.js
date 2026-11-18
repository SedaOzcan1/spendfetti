import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { DEFAULT_CATEGORIES, seedDefaultCategories } from '../src/seed/defaultCategories.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const app = createApp();

beforeEach(() => seedDefaultCategories());

describe('/api/categories', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/categories')).status).toBe(401);
  });

  it('lists default categories plus the user’s own, not other users’', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    await agent.post('/api/categories').send({ name: 'Pets', type: 'expense' });
    await other.post('/api/categories').send({ name: 'Garden', type: 'expense' });

    const res = await agent.get('/api/categories');
    const names = res.body.categories.map((c) => c.name);

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(DEFAULT_CATEGORIES.length + 1);
    expect(names).toContain('Pets');
    expect(names).not.toContain('Garden');
    expect(res.body.categories.find((c) => c.name === 'Pets').isDefault).toBe(false);
  });

  it('filters by type', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.get('/api/categories?type=income');
    expect(res.body.categories.every((c) => c.type === 'income')).toBe(true);
  });

  it('creates a custom category', async () => {
    const { agent, user } = await createAuthedAgent(app);
    const res = await agent
      .post('/api/categories')
      .send({ name: 'Pets', type: 'expense', icon: '🐶', color: '#a855f7' });

    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Pets', userId: user.id, isDefault: false });
  });

  it('rejects duplicates of own or built-in categories', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.post('/api/categories').send({ name: 'Pets', type: 'expense' });

    expect(
      (await agent.post('/api/categories').send({ name: 'pets', type: 'expense' })).status,
    ).toBe(409);
    expect(
      (await agent.post('/api/categories').send({ name: 'groceries', type: 'expense' })).status,
    ).toBe(409);
  });

  it('validates the payload', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.post('/api/categories').send({ name: 'X', type: 'gift', color: 'red' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.path)).toEqual(expect.arrayContaining(['type', 'color']));
  });
});
