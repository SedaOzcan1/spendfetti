import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Notification } from '../src/models/index.js';
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

const list = async (agent, query = '') => (await agent.get(`/api/notifications${query}`)).body;
const types = (body) => body.items.map((n) => n.type);

describe('notifications', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/notifications')).status).toBe(401);
  });

  it('welcomes new users', async () => {
    const { agent } = await createAuthedAgent(app);
    const body = await list(agent);
    expect(types(body)).toEqual(['welcome']);
    expect(body.unreadCount).toBe(1);
    expect(body.items[0]).toMatchObject({ read: false, link: '/transactions' });
    expect(body.items[0]).not.toHaveProperty('dedupeKey');
  });

  it('warns once when a budget gets close to its limit, then when it is exceeded', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.put(`/api/budgets/${ids.groceries}`).send({ limit: 1000 });

    await addTransaction(agent, { categoryId: ids.groceries, amount: 500, date: today });
    expect(types(await list(agent))).toEqual(['welcome']);

    await addTransaction(agent, { categoryId: ids.groceries, amount: 420, date: today });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 10, date: today });
    let body = await list(agent);
    expect(types(body)).toEqual(['budget_warning', 'welcome']);
    expect(body.items[0]).toMatchObject({
      title: 'Groceries is close to its limit',
      link: '/budgets',
    });
    expect(body.items[0].body).toContain('₺920 of ₺1,000 spent');

    await addTransaction(agent, { categoryId: ids.groceries, amount: 200, date: today });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 200, date: today });
    body = await list(agent);
    expect(types(body)).toEqual(['budget_exceeded', 'budget_warning', 'welcome']);
  });

  it('checks budgets when a transaction is edited or a limit is lowered', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.put(`/api/budgets/${ids.transport}`).send({ limit: 1000 });
    const { body } = await addTransaction(agent, {
      categoryId: ids.transport,
      amount: 100,
      date: today,
    });

    await agent.put(`/api/transactions/${body.transaction.id}`).send({ amount: 950 });
    expect(types(await list(agent))).toContain('budget_warning');

    await agent.put(`/api/budgets/${ids.transport}`).send({ limit: 500 });
    expect(types(await list(agent))).toContain('budget_exceeded');
  });

  it('warns when the fun budget is running low', async () => {
    const { agent } = await createAuthedAgent(app);
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 10000,
      date: today,
    });
    await agent.post('/api/fun-budget').send({ month, amount: 1000 });

    await addTransaction(agent, { categoryId: ids['fun-activities'], amount: 700, date: today });
    expect(types(await list(agent))).not.toContain('fun_budget_low');

    await addTransaction(agent, { categoryId: ids['fun-activities'], amount: 150, date: today });
    const body = await list(agent);
    expect(types(body)).toContain('fun_budget_low');
    expect(body.items.find((n) => n.type === 'fun_budget_low').body).toBe(
      '₺150 of ₺1,000 left to explore.',
    );
  });

  it('reminds the user to close last month when it ended with a surplus', async () => {
    const { agent } = await createAuthedAgent(app);
    const lastMonth = shiftMonth(month, -1);
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 5000,
      date: `${lastMonth}-10T12:00:00Z`,
    });

    const body = await list(agent);
    const reminder = body.items.find((n) => n.type === 'month_close_reminder');
    expect(reminder).toMatchObject({ link: `/?closeMonth=${lastMonth}` });
    expect(reminder.body).toContain('₺5,000');

    // Not repeated
    await list(agent);
    expect(await Notification.countDocuments({ type: 'month_close_reminder' })).toBe(1);
  });

  it('skips the reminder once the month was closed or prompts are off', async () => {
    const { agent } = await createAuthedAgent(app);
    const lastMonth = shiftMonth(month, -1);
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 5000,
      date: `${lastMonth}-10T12:00:00Z`,
    });
    await agent.post('/api/fun-budget').send({ month: lastMonth, dismissed: true });
    expect(types(await list(agent))).not.toContain('month_close_reminder');

    const { agent: other } = await createAuthedAgent(app);
    await addTransaction(other, {
      type: 'income',
      categoryId: ids.salary,
      amount: 5000,
      date: `${lastMonth}-10T12:00:00Z`,
    });
    await other.patch('/api/auth/me').send({ funBudgetPromptEnabled: false });
    expect(types(await list(other))).not.toContain('month_close_reminder');
  });

  it('marks notifications read / unread and all as read', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.put(`/api/budgets/${ids.groceries}`).send({ limit: 100 });
    await addTransaction(agent, { categoryId: ids.groceries, amount: 95, date: today });

    const [first] = (await list(agent)).items;
    const read = await agent.patch(`/api/notifications/${first.id}/read`);
    expect(read.body).toMatchObject({ notification: { read: true }, unreadCount: 1 });

    const unread = await agent.patch(`/api/notifications/${first.id}/unread`);
    expect(unread.body.unreadCount).toBe(2);

    await agent.post('/api/notifications/read-all');
    expect((await agent.get('/api/notifications/unread-count')).body).toEqual({ unreadCount: 0 });
    expect((await list(agent, '?unread=true')).items).toEqual([]);
  });

  it('paginates with a cursor', async () => {
    const { agent, user } = await createAuthedAgent(app);
    await Notification.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        userId: user.id,
        type: 'budget_warning',
        title: `n${i}`,
        dedupeKey: `test:${i}`,
        createdAt: new Date(Date.now() - (i + 1) * 60_000),
      })),
    );

    const page1 = await list(agent, '?limit=4');
    expect(page1.items).toHaveLength(4);
    const page2 = await list(agent, `?limit=4&before=${page1.nextCursor}`);
    expect(page2.items.map((n) => n.title)).toEqual(['n3', 'n4']);
    expect(page2.nextCursor).toBeNull();
  });

  it('deletes notifications and keeps them private', async () => {
    const { agent } = await createAuthedAgent(app);
    const { agent: other } = await createAuthedAgent(app);
    const [welcome] = (await list(agent)).items;

    expect((await other.patch(`/api/notifications/${welcome.id}/read`)).status).toBe(404);
    expect((await other.delete(`/api/notifications/${welcome.id}`)).status).toBe(404);
    expect((await agent.delete(`/api/notifications/${welcome.id}`)).status).toBe(204);
    expect((await list(agent)).items).toEqual([]);
  });
});
