import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Notification } from '../src/models/index.js';
import { describeGoal } from '../src/services/savingsService.js';
import { toMonthKey } from '../src/utils/month.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';
import { addTransaction, seedCategoryIds } from './helpers/fixtures.js';

useTestDb();

const app = createApp();
const month = toMonthKey();
const today = new Date().toISOString();
let ids;
let agent;

beforeEach(async () => {
  ids = await seedCategoryIds();
  ({ agent } = await createAuthedAgent(app));
});

const createGoal = (body = {}) =>
  agent.post('/api/savings/goals').send({ name: 'Emergency fund', targetAmount: 10000, ...body });
const deposit = (goalId, amount, extra = {}) =>
  agent.post('/api/savings/entries').send({ goalId, amount, ...extra });

describe('describeGoal', () => {
  it('computes progress and the monthly amount needed to reach the target', () => {
    const goal = {
      targetAmount: 12000,
      targetDate: new Date('2027-05-01T00:00:00Z'),
      toJSON: () => ({}),
    };
    const result = describeGoal(goal, 3000, new Date('2026-11-18T00:00:00Z'));
    expect(result).toMatchObject({
      saved: 3000,
      remaining: 9000,
      progress: 0.25,
      monthsLeft: 6,
      monthlyNeeded: 1500,
    });
  });
});

describe('/api/savings', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/savings')).status).toBe(401);
  });

  it('creates goals and tracks deposits and withdrawals', async () => {
    const { body } = await createGoal({ kind: 'investment', targetDate: '2027-12-31' });
    expect(body.goal).toMatchObject({
      name: 'Emergency fund',
      kind: 'investment',
      saved: 0,
      progress: 0,
    });

    await deposit(body.goal.id, 4000);
    const withdrawal = await deposit(body.goal.id, 1500, { type: 'withdrawal' });
    expect(withdrawal.body.goal).toMatchObject({ saved: 2500, remaining: 7500, progress: 0.25 });

    const overview = await agent.get(`/api/savings?month=${month}`);
    expect(overview.body).toMatchObject({
      totalSaved: 2500,
      byKind: { savings: 0, investment: 2500 },
      savedThisMonth: 2500,
      goalsReached: 0,
    });
  });

  it('does not let users withdraw more than they saved', async () => {
    const { body } = await createGoal();
    await deposit(body.goal.id, 100);
    const res = await deposit(body.goal.id, 101, { type: 'withdrawal' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe('amount');
  });

  it('celebrates and notifies once when a goal is reached', async () => {
    const { body } = await createGoal({ targetAmount: 1000 });
    expect((await deposit(body.goal.id, 600)).body.goalReached).toBe(false);

    const reached = await deposit(body.goal.id, 400);
    expect(reached.body.goalReached).toBe(true);
    expect(reached.body.goal.achievedAt).toBeTruthy();
    expect((await deposit(body.goal.id, 50)).body.goalReached).toBe(false);
    expect(await Notification.countDocuments({ type: 'savings_goal_reached' })).toBe(1);
  });

  it('does not count savings as expenses', async () => {
    const { body } = await createGoal();
    await deposit(body.goal.id, 500);
    const summary = await agent.get(`/api/summary?month=${month}`);
    expect(summary.body.totals.expense).toBe(0);
  });

  it('updates and deletes goals (with their entries), privately per user', async () => {
    const { body } = await createGoal();
    await deposit(body.goal.id, 500);
    const { agent: other } = await createAuthedAgent(app);

    expect(
      (await other.patch(`/api/savings/goals/${body.goal.id}`).send({ name: 'x' })).status,
    ).toBe(404);
    expect(
      (await other.post('/api/savings/entries').send({ goalId: body.goal.id, amount: 1 })).status,
    ).toBe(404);

    const updated = await agent
      .patch(`/api/savings/goals/${body.goal.id}`)
      .send({ name: 'Rainy day', targetAmount: 400, targetDate: null });
    expect(updated.body.goal).toMatchObject({ name: 'Rainy day', progress: 1 });
    expect(updated.body.goal.achievedAt).toBeTruthy();

    expect((await agent.delete(`/api/savings/goals/${body.goal.id}`)).status).toBe(204);
    expect((await agent.get('/api/savings/entries')).body.entries).toEqual([]);
  });
});

describe('POST /api/savings/month-close', () => {
  beforeEach(async () => {
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 10000,
      date: today,
    });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 4000, date: today });
  });

  it('splits the surplus between fun and savings in one step', async () => {
    const { body } = await createGoal();
    const res = await agent
      .post('/api/savings/month-close')
      .send({ month, funAmount: 1200, savings: [{ goalId: body.goal.id, amount: 3000 }] });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ funAmount: 1200, saved: 3000, goalsReached: [] });
    expect((await agent.get(`/api/fun-budget?month=${month}`)).body.allocated).toBe(1200);
    expect((await agent.get('/api/savings')).body.totalSaved).toBe(3000);
    // The month counts as closed: no prompt again
    expect((await agent.get(`/api/fun-budget/prompt?month=${month}`)).body.show).toBe(false);
  });

  it('allows saving without a fun budget', async () => {
    const { body } = await createGoal();
    await agent
      .post('/api/savings/month-close')
      .send({ month, funAmount: 0, savings: [{ goalId: body.goal.id, amount: 6000 }] });
    expect((await agent.get(`/api/fun-budget?month=${month}`)).body.status).toBe('dismissed');
  });

  it('rejects totals above the surplus and closing twice', async () => {
    const { body } = await createGoal();
    const tooMuch = await agent
      .post('/api/savings/month-close')
      .send({ month, funAmount: 2000, savings: [{ goalId: body.goal.id, amount: 4001 }] });
    expect(tooMuch.status).toBe(400);

    await agent.post('/api/savings/month-close').send({ month, funAmount: 100 });
    const again = await agent.post('/api/savings/month-close').send({ month, funAmount: 100 });
    expect(again.status).toBe(409);
  });

  it('keeps later fun budget edits within what is left after savings', async () => {
    const { body } = await createGoal();
    await agent
      .post('/api/savings/month-close')
      .send({ month, funAmount: 1000, savings: [{ goalId: body.goal.id, amount: 4000 }] });

    expect((await agent.post('/api/fun-budget').send({ month, amount: 2000 })).status).toBe(201);
    const tooMuch = await agent.post('/api/fun-budget').send({ month, amount: 2001 });
    expect(tooMuch.status).toBe(400);
  });

  it('rejects another user’s goal', async () => {
    const { agent: other } = await createAuthedAgent(app);
    const { body } = await other
      .post('/api/savings/goals')
      .send({ name: 'Theirs', targetAmount: 1000 });
    const res = await agent
      .post('/api/savings/month-close')
      .send({ month, savings: [{ goalId: body.goal.id, amount: 100 }] });
    expect(res.status).toBe(404);
  });
});
