import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';
import { addTransaction, seedCategoryIds } from './helpers/fixtures.js';

useTestDb();

const app = createApp();
let ids;

beforeEach(async () => {
  ids = await seedCategoryIds();
});

describe('/api/budgets', () => {
  it('creates and updates a budget (upsert)', async () => {
    const { agent } = await createAuthedAgent(app);

    const created = await agent.put(`/api/budgets/${ids.groceries}`).send({ limit: 9000 });
    expect(created.status).toBe(200);
    expect(created.body.budget).toMatchObject({ limit: 9000, alertThreshold: 0.9 });

    const updated = await agent
      .put(`/api/budgets/${ids.groceries}`)
      .send({ limit: 8000, alertThreshold: 0.9 });
    expect(updated.body.budget).toMatchObject({ id: created.body.budget.id, limit: 8000 });
  });

  it('lists budgets with spending and status for a month', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.put(`/api/budgets/${ids.groceries}`).send({ limit: 1000 });
    await agent.put(`/api/budgets/${ids.transport}`).send({ limit: 1000 });
    await agent.put(`/api/budgets/${ids.housing}`).send({ limit: 1000 });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 1200 });
    await addTransaction(agent, { categoryId: ids.transport, amount: 950 });
    await addTransaction(agent, {
      categoryId: ids.housing,
      amount: 999,
      date: '2026-10-10T00:00:00Z',
    });

    const res = await agent.get('/api/budgets?month=2026-11');
    expect(res.body.budgets.map((b) => [b.category.name, b.spent, b.status])).toEqual([
      ['Groceries', 1200, 'exceeded'],
      ['Transport', 950, 'warning'],
      ['Rent', 0, 'ok'],
    ]);
  });

  it('rejects budgets on income categories', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.put(`/api/budgets/${ids.salary}`).send({ limit: 1000 });
    expect(res.status).toBe(400);
  });

  it('deletes a budget', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.put(`/api/budgets/${ids.groceries}`).send({ limit: 1000 });

    expect((await agent.delete(`/api/budgets/${ids.groceries}`)).status).toBe(204);
    expect((await agent.delete(`/api/budgets/${ids.groceries}`)).status).toBe(404);
  });

  it('keeps budgets private to each user', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    await other.put(`/api/budgets/${ids.groceries}`).send({ limit: 1000 });

    expect((await agent.get('/api/budgets')).body.budgets).toEqual([]);
  });
});
