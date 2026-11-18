import { describe, expect, it } from 'vitest';
import { Budget, Category, FUN_CATEGORY_SLUG, Transaction, User } from '../src/models/index.js';
import { DEFAULT_CATEGORIES, seedDefaultCategories } from '../src/seed/defaultCategories.js';
import { useTestDb } from './helpers/db.js';

useTestDb();

const createUser = (overrides = {}) =>
  User.create({ email: 'Ada@Example.com', passwordHash: 'hash', name: 'Ada', ...overrides });

describe('User', () => {
  it('applies defaults and normalizes email', async () => {
    const user = await createUser();
    expect(user.email).toBe('ada@example.com');
    expect(user.currency).toBe('TRY');
    expect(user.funBudgetPromptEnabled).toBe(true);
    expect(user.funBudgetRatio).toBe(0.2);
    expect(user.confettiEnabled).toBe(true);
  });

  it('never exposes the password hash in JSON', async () => {
    const json = (await createUser()).toJSON();
    expect(json).not.toHaveProperty('passwordHash');
    expect(json).toHaveProperty('id');
  });

  it('does not select the password hash by default', async () => {
    await createUser();
    expect((await User.findOne()).passwordHash).toBeUndefined();
    expect((await User.findOne().select('+passwordHash')).passwordHash).toBe('hash');
  });

  it('enforces unique emails (case-insensitive)', async () => {
    await createUser();
    await expect(createUser({ email: 'ADA@example.com' })).rejects.toThrow(/duplicate key/);
  });

  it('rejects a fun budget ratio above 1', async () => {
    await expect(createUser({ funBudgetRatio: 1.5 })).rejects.toThrow(/funBudgetRatio/);
  });
});

describe('Category', () => {
  it('seeds default categories idempotently', async () => {
    await seedDefaultCategories();
    await seedDefaultCategories();
    expect(await Category.countDocuments()).toBe(DEFAULT_CATEGORIES.length);

    const fun = await Category.findOne({ slug: FUN_CATEGORY_SLUG });
    expect(fun.name).toBe('Fun & Activities');
    expect(fun.isDefault).toBe(true);
  });

  it('prevents duplicate names per user and type (case-insensitive)', async () => {
    const user = await createUser();
    await Category.create({ userId: user._id, name: 'Pets', type: 'expense' });
    await expect(
      Category.create({ userId: user._id, name: 'pets', type: 'expense' }),
    ).rejects.toThrow(/duplicate key/);
    await expect(
      Category.create({ userId: user._id, name: 'Pets', type: 'income' }),
    ).resolves.toBeTruthy();
  });

  it('allows different users to use the same category name', async () => {
    const ada = await createUser();
    const bob = await createUser({ email: 'bob@example.com' });
    await Category.create({ userId: ada._id, name: 'Pets', type: 'expense' });
    await expect(
      Category.create({ userId: bob._id, name: 'Pets', type: 'expense' }),
    ).resolves.toBeTruthy();
  });
});

describe('Transaction', () => {
  it('requires a positive amount and a valid type', async () => {
    const user = await createUser();
    const category = await Category.create({ userId: user._id, name: 'Pets', type: 'expense' });
    const base = { userId: user._id, categoryId: category._id, date: new Date() };

    await expect(Transaction.create({ ...base, type: 'expense', amount: 0 })).rejects.toThrow(
      /amount/,
    );
    await expect(Transaction.create({ ...base, type: 'gift', amount: 10 })).rejects.toThrow(/type/);
    await expect(
      Transaction.create({ ...base, type: 'expense', amount: 12.5 }),
    ).resolves.toBeTruthy();
  });
});

describe('Budget', () => {
  it('allows only one budget per user and category', async () => {
    const user = await createUser();
    const category = await Category.create({ userId: user._id, name: 'Pets', type: 'expense' });
    const budget = await Budget.create({ userId: user._id, categoryId: category._id, limit: 500 });
    expect(budget.alertThreshold).toBe(0.8);

    await expect(
      Budget.create({ userId: user._id, categoryId: category._id, limit: 300 }),
    ).rejects.toThrow(/duplicate key/);
  });
});
