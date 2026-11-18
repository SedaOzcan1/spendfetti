import { describe, expect, it } from 'vitest';
import { User } from '../src/models/index.js';
import { seedDemoUser } from '../src/seed/demoData.js';
import { getMonthlySummary } from '../src/services/summaryService.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

describe('seedDemoUser', () => {
  it('creates a demo account whose current month matches the design', async () => {
    const now = new Date('2026-11-18T10:00:00Z');
    await seedDemoUser(now);
    await seedDemoUser(now); // idempotent

    expect(await User.countDocuments()).toBe(1);
    const user = await User.findOne();
    const summary = await getMonthlySummary(user, '2026-11');

    expect(summary.totals).toEqual({ income: 45000, expense: 28500, balance: 16500 });
    expect(summary.trend.every((t) => t.income > 0)).toBe(true);
    expect(summary.budgets).toHaveLength(5);
    expect(summary.funBudget.suggestedAmount).toBe(3300);
  });
});
