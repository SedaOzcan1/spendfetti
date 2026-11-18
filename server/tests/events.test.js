import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Event } from '../src/models/index.js';
import { generateSampleEvents, seedEventsIfNeeded } from '../src/seed/sampleEvents.js';
import { toMonthKey } from '../src/utils/month.js';
import { createAuthedAgent } from './helpers/auth.js';
import { useTestDb } from './helpers/db.js';
import { addTransaction, seedCategoryIds } from './helpers/fixtures.js';

useTestDb();

const app = createApp();
const day = 86_400_000;
const inDays = (n) => new Date(Date.now() + n * day);

const event = (overrides = {}) => ({
  title: 'Jazz night',
  type: 'concert',
  city: 'Istanbul',
  venue: 'Kadıköy Stage',
  startsAt: inDays(3),
  minPrice: 650,
  maxPrice: 900,
  url: 'https://example.com/jazz',
  source: 'test',
  externalId: `e-${Math.random()}`,
  ...overrides,
});

let agent;

beforeEach(async () => {
  ({ agent } = await createAuthedAgent(app));
  await Event.insertMany([
    event({ title: 'Jazz night', minPrice: 650 }),
    event({ title: 'Clay workshop', type: 'workshop', minPrice: 900, startsAt: inDays(4) }),
    event({
      title: 'Free gallery',
      type: 'exhibition',
      minPrice: 0,
      maxPrice: 0,
      startsAt: inDays(5),
    }),
    event({
      title: 'Mystery play',
      type: 'theatre',
      minPrice: null,
      maxPrice: null,
      startsAt: inDays(2),
    }),
    event({ title: 'Ankara concert', city: 'Ankara', minPrice: 300 }),
    event({ title: 'Past concert', startsAt: inDays(-2) }),
    event({ title: 'Far future', startsAt: inDays(60), minPrice: 100 }),
  ]);
});

const titles = (res) => res.body.items.map((e) => e.title);

describe('GET /api/events', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/events')).status).toBe(401);
  });

  it('lists upcoming events sorted by date, never past ones', async () => {
    const res = await agent.get('/api/events?city=Istanbul');
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual([
      'Mystery play',
      'Jazz night',
      'Clay workshop',
      'Free gallery',
      'Far future',
    ]);
    expect(res.body).toMatchObject({ total: 5, page: 1, hasMore: false });
  });

  it('matches city case-insensitively and filters by several types', async () => {
    const res = await agent.get('/api/events?city=istanbul&type=workshop,exhibition');
    expect(titles(res)).toEqual(['Clay workshop', 'Free gallery']);
  });

  it('filters by date range', async () => {
    const res = await agent.get(
      `/api/events?city=Istanbul&from=${inDays(3.5).toISOString()}&to=${inDays(10).toISOString()}`,
    );
    expect(titles(res)).toEqual(['Clay workshop', 'Free gallery']);
  });

  it('applies maxPrice and excludes events with unknown prices', async () => {
    const res = await agent.get('/api/events?city=Istanbul&maxPrice=700');
    expect(titles(res)).toEqual(['Jazz night', 'Free gallery', 'Far future']);
  });

  it('filters free events', async () => {
    const res = await agent.get('/api/events?free=true');
    expect(titles(res)).toEqual(['Free gallery']);
  });

  it('sorts by price with unknown prices last', async () => {
    const res = await agent.get('/api/events?city=Istanbul&sort=price');
    expect(titles(res)).toEqual([
      'Free gallery',
      'Far future',
      'Jazz night',
      'Clay workshop',
      'Mystery play',
    ]);
  });

  it('paginates', async () => {
    const first = await agent.get('/api/events?city=Istanbul&limit=2');
    const second = await agent.get('/api/events?city=Istanbul&limit=2&page=2');
    expect(first.body).toMatchObject({ total: 5, hasMore: true });
    expect(titles(second)).toEqual(['Clay workshop', 'Free gallery']);
  });

  it('defaults maxPrice to the remaining fun budget when withinBudget=true', async () => {
    const ids = await seedCategoryIds();
    const month = toMonthKey();
    const today = new Date().toISOString();
    await addTransaction(agent, {
      type: 'income',
      categoryId: ids.salary,
      amount: 5000,
      date: today,
    });
    await agent.post('/api/fun-budget').send({ month, amount: 1000 });
    await addTransaction(agent, { categoryId: ids['fun-activities'], amount: 300, date: today });

    const res = await agent.get(`/api/events?city=Istanbul&withinBudget=true&month=${month}`);
    expect(res.body.appliedMaxPrice).toBe(700);
    expect(titles(res)).toEqual(['Jazz night', 'Free gallery', 'Far future']);
  });

  it('only shows free events within budget when no budget is set aside', async () => {
    const res = await agent.get('/api/events?city=Istanbul&withinBudget=true');
    expect(res.body.appliedMaxPrice).toBe(0);
    expect(titles(res)).toEqual(['Free gallery']);
  });

  it('validates query parameters', async () => {
    expect((await agent.get('/api/events?type=opera')).status).toBe(400);
    expect((await agent.get('/api/events?limit=500')).status).toBe(400);
  });
});

describe('GET /api/events/meta', () => {
  it('returns cities with upcoming events and all types', async () => {
    const res = await agent.get('/api/events/meta');
    expect(res.body.cities).toEqual(['Ankara', 'Istanbul']);
    expect(res.body.types).toContain('standup');
  });
});

describe('POST /api/events/:id/click', () => {
  it('counts clicks and returns the outbound url', async () => {
    const target = await Event.findOne({ title: 'Jazz night' });
    const res = await agent.post(`/api/events/${target.id}/click`);
    expect(res.body.url).toBe('https://example.com/jazz');
    expect((await Event.findById(target.id)).clicks).toBe(1);
  });

  it('returns 404 for unknown events', async () => {
    const res = await agent.post('/api/events/0123456789abcdef01234567/click');
    expect(res.status).toBe(404);
  });
});

describe('sample events', () => {
  it('generates deterministic, upcoming events across six cities', () => {
    const now = new Date('2026-11-18T10:00:00Z');
    const a = generateSampleEvents({ now });
    const b = generateSampleEvents({ now });

    expect(a).toEqual(b);
    expect(a).toHaveLength(108);
    expect(new Set(a.map((e) => e.city)).size).toBe(6);
    expect(a.every((e) => e.startsAt > now)).toBe(true);
    expect(a.some((e) => e.minPrice === 0)).toBe(true);
  });

  it('seeds only when there are no upcoming seeded events', async () => {
    expect(await seedEventsIfNeeded()).toBe(108);
    expect(await seedEventsIfNeeded()).toBe(0);
  });
});
