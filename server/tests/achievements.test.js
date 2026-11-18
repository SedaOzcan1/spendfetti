import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { earnedAchievements } from '../src/services/achievementService.js';
import { shiftMonth, toMonthKey } from '../src/utils/month.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';
import { addTransaction, seedCategoryIds } from './helpers/fixtures.js';

useTestDb();

const app = createApp();
const currentMonth = toMonthKey();
const lastMonth = shiftMonth(currentMonth, -1);
const midOf = (month) => `${month}-15T12:00:00Z`;
let ids;

beforeEach(async () => {
  ids = await seedCategoryIds();
});

describe('earnedAchievements', () => {
  const budgets = [
    { categoryId: 'a', spent: 90, limit: 100 },
    { categoryId: 'b', spent: 120, limit: 100 },
  ];

  it('earns nothing while the month is still open', () => {
    expect(earnedAchievements({ closed: false, balance: 500, budgets })).toEqual([]);
  });

  it('earns month_positive and per-budget achievements in a closed month', () => {
    expect(earnedAchievements({ closed: true, balance: 500, budgets })).toEqual([
      'month_positive',
      'budget_met:a',
    ]);
  });

  it('earns all_budgets_met only when every budget was met', () => {
    expect(earnedAchievements({ closed: true, balance: -1, budgets: [budgets[0]] })).toEqual([
      'budget_met:a',
      'all_budgets_met',
    ]);
    expect(earnedAchievements({ closed: true, balance: 0, budgets: [] })).toEqual([]);
  });
});

describe('summary achievements', () => {
  async function closedPositiveMonth() {
    const { agent } = await createAuthedAgent(app);
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 5000,
      date: midOf(lastMonth),
    });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 800, date: midOf(lastMonth) });
    await agent.put(`/api/budgets/${ids.groceries}`).send({ limit: 1000 });
    return agent;
  }

  it('reports unseen achievements for a past month until they are marked seen', async () => {
    const agent = await closedPositiveMonth();

    const first = await agent.get(`/api/summary?month=${lastMonth}`);
    expect(first.body.monthClosed).toBe(true);
    expect(first.body.achievements).toEqual([
      'month_positive',
      `budget_met:${ids.groceries}`,
      'all_budgets_met',
    ]);

    const seen = await agent
      .post('/api/achievements/seen')
      .send({ month: lastMonth, keys: first.body.achievements });
    expect(seen.status).toBe(204);

    const again = await agent.get(`/api/summary?month=${lastMonth}`);
    expect(again.body.achievements).toEqual([]);
  });

  it('keeps the current month open until the user closes it', async () => {
    const { agent } = await createAuthedAgent(app);
    const today = new Date().toISOString();
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 5000,
      date: today,
    });

    const open = await agent.get(`/api/summary?month=${currentMonth}`);
    expect(open.body).toMatchObject({ monthClosed: false, achievements: [] });

    await agent.post('/api/fun-budget').send({ month: currentMonth, dismissed: true });
    const closed = await agent.get(`/api/summary?month=${currentMonth}`);
    expect(closed.body).toMatchObject({ monthClosed: true, achievements: ['month_positive'] });
  });

  it('validates achievement keys', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent
      .post('/api/achievements/seen')
      .send({ month: lastMonth, keys: ['hack'] });
    expect(res.status).toBe(400);
  });
});

describe('first transaction', () => {
  it('is reported only for the very first transaction', async () => {
    const { agent } = await createAuthedAgent(app);
    const first = await addTransaction(agent, { categoryId: ids.groceries });
    const second = await addTransaction(agent, { categoryId: ids.groceries });

    expect(first.body.achievements).toEqual(['first_transaction']);
    expect(second.body.achievements).toEqual([]);
  });
});
