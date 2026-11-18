import request from 'supertest';
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

describe('GET /api/summary', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/summary?month=2026-11')).status).toBe(401);
  });

  it('returns totals, comparison, category breakdown, trend and budgets', async () => {
    const { agent } = await createAuthedAgent(app);
    const income = (amount, date) =>
      addTransaction(agent, { type: 'income', categoryId: ids.salary, amount, date });

    await income(40000, '2026-10-01T09:00:00Z');
    await addTransaction(agent, {
      categoryId: ids.housing,
      amount: 12000,
      date: '2026-10-05T09:00:00Z',
    });

    await income(45000, '2026-11-01T09:00:00Z');
    await addTransaction(agent, { categoryId: ids.housing, amount: 12000 });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 6000 });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 1500 });
    await addTransaction(agent, { categoryId: ids['dining-out'], amount: 4500 });
    // Outside the 6-month window and another month entirely
    await income(99999, '2026-05-15T09:00:00Z');
    await addTransaction(agent, {
      categoryId: ids.groceries,
      amount: 777,
      date: '2026-12-01T00:00:00Z',
    });

    await agent.put(`/api/budgets/${ids['dining-out']}`).send({ limit: 5000 });

    const res = await agent.get('/api/summary?month=2026-11');
    expect(res.status).toBe(200);

    const { totals, comparison, byCategory, trend, budgets, funBudget } = res.body;
    expect(totals).toEqual({ income: 45000, expense: 24000, balance: 21000 });
    expect(comparison).toEqual({
      incomeChangePct: 12.5,
      expenseChangePct: 100,
      expenseToIncomeRatio: 0.53,
    });

    expect(byCategory.map((c) => [c.name, c.total, c.share])).toEqual([
      ['Housing', 12000, 0.5],
      ['Groceries', 7500, 0.31],
      ['Dining Out', 4500, 0.19],
    ]);

    expect(trend.map((t) => t.month)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(trend[0]).toEqual({ month: '2026-06', income: 0, expense: 0 });
    expect(trend[4]).toEqual({ month: '2026-10', income: 40000, expense: 12000 });

    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject({
      category: { name: 'Dining Out' },
      limit: 5000,
      spent: 4500,
      remaining: 500,
      usage: 0.9,
      status: 'warning',
    });

    expect(funBudget).toEqual({ ratio: 0.2, suggestedAmount: 4200 });
  });

  it('handles an empty month without dividing by zero', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.get('/api/summary?month=2026-11');

    expect(res.body.totals).toEqual({ income: 0, expense: 0, balance: 0 });
    expect(res.body.comparison).toEqual({
      incomeChangePct: null,
      expenseChangePct: null,
      expenseToIncomeRatio: null,
    });
    expect(res.body.byCategory).toEqual([]);
    expect(res.body.funBudget.suggestedAmount).toBe(0);
  });

  it('only includes the current user’s data', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    await addTransaction(other, { categoryId: ids.groceries, amount: 500 });

    const res = await agent.get('/api/summary?month=2026-11');
    expect(res.body.totals.expense).toBe(0);
  });
});
