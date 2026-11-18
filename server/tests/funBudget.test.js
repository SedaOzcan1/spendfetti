import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { spendingWindow, suggestAmount } from '../src/services/funBudgetService.js';
import { shiftMonth, toMonthKey } from '../src/utils/month.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';
import { addTransaction, seedCategoryIds } from './helpers/fixtures.js';

useTestDb();

const app = createApp();
const month = toMonthKey();
const today = new Date().toISOString();
let ids;

beforeEach(async () => {
  ids = await seedCategoryIds();
});

async function userWithSurplus(income = 10000, expense = 4000) {
  const session = await createAuthedAgent(app);
  await addTransaction(session.agent, {
    type: 'income',
    categoryId: ids.salary,
    amount: income,
    date: today,
  });
  await addTransaction(session.agent, { categoryId: ids.groceries, amount: expense, date: today });
  return session;
}

describe('suggestAmount', () => {
  it('suggests a ratio of a positive balance, never more than the balance', () => {
    expect(suggestAmount(16500, 0.2)).toBe(3300);
    expect(suggestAmount(100, 1)).toBe(100);
    expect(suggestAmount(-50, 0.2)).toBe(0);
  });
});

describe('spendingWindow', () => {
  it('runs from the allocation day to the end of the following month', () => {
    const window = spendingWindow({
      month: '2026-11',
      allocatedAt: new Date('2026-11-30T21:15:00Z'),
    });
    expect(window.start.toISOString()).toBe('2026-11-30T00:00:00.000Z');
    expect(window.end.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('GET /api/fun-budget/prompt', () => {
  it('shows the prompt for a positive balance with a suggested amount', async () => {
    const { agent } = await userWithSurplus();
    const res = await agent.get(`/api/fun-budget/prompt?month=${month}`);
    expect(res.body).toEqual({
      show: true,
      reason: null,
      balance: 6000,
      ratio: 0.2,
      suggestedAmount: 1200,
      savingsRatio: 0.5,
      suggestedSavings: 3000,
    });
  });

  it('hides the prompt when the month has no surplus', async () => {
    const { agent } = await userWithSurplus(1000, 1500);
    const res = await agent.get(`/api/fun-budget/prompt?month=${month}`);
    expect(res.body).toMatchObject({ show: false, reason: 'no_surplus', suggestedAmount: 0 });
  });

  it('respects the user ratio and opt-out setting', async () => {
    const { agent } = await userWithSurplus();
    await agent.patch('/api/auth/me').send({ funBudgetRatio: 0.5 });
    expect((await agent.get(`/api/fun-budget/prompt?month=${month}`)).body.suggestedAmount).toBe(
      3000,
    );

    await agent.patch('/api/auth/me').send({ funBudgetPromptEnabled: false });
    expect((await agent.get(`/api/fun-budget/prompt?month=${month}`)).body).toMatchObject({
      show: false,
      reason: 'disabled',
    });
  });

  it('is shown at most once per month', async () => {
    const { agent } = await userWithSurplus();
    await agent.post('/api/fun-budget').send({ month, dismissed: true });

    const res = await agent.get(`/api/fun-budget/prompt?month=${month}`);
    expect(res.body).toMatchObject({ show: false, reason: 'already_decided' });
  });
});

describe('POST /api/fun-budget', () => {
  it('allocates a budget and tracks fun spending against it', async () => {
    const { agent } = await userWithSurplus();
    const created = await agent.post('/api/fun-budget').send({ month, amount: 1200 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ status: 'allocated', allocated: 1200, spent: 0 });

    await addTransaction(agent, { categoryId: ids['fun-activities'], amount: 450, date: today });
    // Other categories don't count as fun spending
    await addTransaction(agent, { categoryId: ids.groceries, amount: 99, date: today });

    const res = await agent.get(`/api/fun-budget?month=${month}`);
    expect(res.body).toMatchObject({ allocated: 1200, spent: 450, remaining: 750 });
  });

  it('lets the user change the amount later', async () => {
    const { agent } = await userWithSurplus();
    await agent.post('/api/fun-budget').send({ month, amount: 1200 });
    const res = await agent.post('/api/fun-budget').send({ month, amount: 2000 });
    expect(res.body.allocated).toBe(2000);
  });

  it('rejects amounts larger than the month’s surplus', async () => {
    const { agent } = await userWithSurplus();
    const res = await agent.post('/api/fun-budget').send({ month, amount: 6001 });
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe('amount');
  });

  it('rejects allocation for a month without surplus', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.post('/api/fun-budget').send({ month, amount: 10 });
    expect(res.status).toBe(400);
  });

  it('"never ask again" turns the prompt off for good', async () => {
    const { agent } = await userWithSurplus();
    await agent.post('/api/fun-budget').send({ month, dismissed: true, neverAsk: true });

    const me = await agent.get('/api/auth/me');
    expect(me.body.user.funBudgetPromptEnabled).toBe(false);
    const next = await agent.get(`/api/fun-budget/prompt?month=${shiftMonth(month, 1)}`);
    expect(next.body.reason).toBe('disabled');
  });

  it('allows allocating after dismissing, but not dismissing an allocation', async () => {
    const { agent } = await userWithSurplus();
    await agent.post('/api/fun-budget').send({ month, dismissed: true });
    expect((await agent.post('/api/fun-budget').send({ month, amount: 500 })).status).toBe(201);
    expect((await agent.post('/api/fun-budget').send({ month, dismissed: true })).status).toBe(409);
  });

  it('reports "none" when nothing was decided', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.get(`/api/fun-budget?month=${month}`);
    expect(res.body).toMatchObject({ status: 'none', allocated: 0, remaining: 0 });
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/fun-budget/prompt')).status).toBe(401);
  });
});
