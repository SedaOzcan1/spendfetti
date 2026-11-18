import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Category } from '../src/models/index.js';
import { seedDefaultCategories } from '../src/seed/defaultCategories.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const app = createApp();
let groceries;
let salary;

beforeEach(async () => {
  await seedDefaultCategories();
  groceries = (await Category.findOne({ slug: 'groceries' })).id;
  salary = (await Category.findOne({ slug: 'salary' })).id;
});

const expense = (overrides = {}) => ({
  type: 'expense',
  amount: 120.456,
  categoryId: groceries,
  date: '2026-11-10T12:00:00.000Z',
  note: 'Weekly shop',
  ...overrides,
});

describe('POST /api/transactions', () => {
  it('requires authentication', async () => {
    expect((await request(app).post('/api/transactions').send(expense())).status).toBe(401);
  });

  it('creates a transaction and rounds the amount to 2 decimals', async () => {
    const { agent, user } = await createAuthedAgent(app);
    const res = await agent.post('/api/transactions').send(expense());

    expect(res.status).toBe(201);
    expect(res.body.transaction).toMatchObject({
      type: 'expense',
      amount: 120.46,
      categoryId: groceries,
      userId: user.id,
      note: 'Weekly shop',
    });
  });

  it('rejects a category whose type does not match', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.post('/api/transactions').send(expense({ categoryId: salary }));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/income transactions/);
  });

  it('rejects another user’s custom category', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    const { body } = await other.post('/api/categories').send({ name: 'Pets', type: 'expense' });

    const res = await agent
      .post('/api/transactions')
      .send(expense({ categoryId: body.category.id }));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Unknown category');
  });

  it('validates the payload', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent
      .post('/api/transactions')
      .send({ type: 'expense', amount: -5, categoryId: 'nope', date: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['amount', 'categoryId', 'date']),
    );
  });
});

describe('GET /api/transactions', () => {
  it('lists only the selected month, newest first, scoped to the user', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);

    await agent.post('/api/transactions').send(expense({ date: '2026-11-01T00:00:00Z' }));
    await agent.post('/api/transactions').send(expense({ date: '2026-11-30T23:59:59Z' }));
    await agent.post('/api/transactions').send(expense({ date: '2026-10-31T23:59:59Z' }));
    await agent.post('/api/transactions').send(expense({ date: '2026-12-01T00:00:00Z' }));
    await other.post('/api/transactions').send(expense());

    const res = await agent.get('/api/transactions?month=2026-11');
    expect(res.status).toBe(200);
    expect(res.body.month).toBe('2026-11');
    expect(res.body.transactions.map((t) => t.date)).toEqual([
      '2026-11-30T23:59:59.000Z',
      '2026-11-01T00:00:00.000Z',
    ]);
  });

  it('filters by type and category', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.post('/api/transactions').send(expense());
    await agent
      .post('/api/transactions')
      .send(expense({ type: 'income', categoryId: salary, amount: 5000 }));

    const byType = await agent.get('/api/transactions?month=2026-11&type=income');
    expect(byType.body.transactions).toHaveLength(1);
    expect(byType.body.transactions[0].amount).toBe(5000);

    const byCategory = await agent.get(`/api/transactions?month=2026-11&category=${groceries}`);
    expect(byCategory.body.transactions).toHaveLength(1);
    expect(byCategory.body.transactions[0].categoryId).toBe(groceries);
  });

  it('rejects an invalid month', async () => {
    const { agent } = await createAuthedAgent(app);
    expect((await agent.get('/api/transactions?month=2026-13')).status).toBe(400);
  });
});

describe('PUT /api/transactions/:id', () => {
  it('updates the user’s own transaction', async () => {
    const { agent } = await createAuthedAgent(app);
    const { body } = await agent.post('/api/transactions').send(expense());

    const res = await agent
      .put(`/api/transactions/${body.transaction.id}`)
      .send({ amount: 99.99, note: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.transaction).toMatchObject({ amount: 99.99, note: 'Updated' });
  });

  it('re-checks the category when only the type changes', async () => {
    const { agent } = await createAuthedAgent(app);
    const { body } = await agent.post('/api/transactions').send(expense());

    const res = await agent
      .put(`/api/transactions/${body.transaction.id}`)
      .send({ type: 'income' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for another user’s transaction', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    const { body } = await other.post('/api/transactions').send(expense());

    const res = await agent.put(`/api/transactions/${body.transaction.id}`).send({ amount: 1 });
    expect(res.status).toBe(404);
  });

  it('rejects an empty update and malformed ids', async () => {
    const { agent } = await createAuthedAgent(app);
    const { body } = await agent.post('/api/transactions').send(expense());

    expect((await agent.put(`/api/transactions/${body.transaction.id}`).send({})).status).toBe(400);
    expect((await agent.put('/api/transactions/not-an-id').send({ amount: 1 })).status).toBe(400);
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('deletes the user’s own transaction', async () => {
    const { agent } = await createAuthedAgent(app);
    const { body } = await agent.post('/api/transactions').send(expense());

    expect((await agent.delete(`/api/transactions/${body.transaction.id}`)).status).toBe(204);
    const list = await agent.get('/api/transactions?month=2026-11');
    expect(list.body.transactions).toHaveLength(0);
  });

  it('returns 404 for another user’s transaction', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    const { body } = await other.post('/api/transactions').send(expense());

    expect((await agent.delete(`/api/transactions/${body.transaction.id}`)).status).toBe(404);
  });
});
