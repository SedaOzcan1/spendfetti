import { Category } from '../../src/models/index.js';
import { seedDefaultCategories } from '../../src/seed/defaultCategories.js';

/** Seeds default categories and returns their ids keyed by slug. */
export async function seedCategoryIds() {
  await seedDefaultCategories();
  const categories = await Category.find({ userId: null });
  return Object.fromEntries(categories.map((c) => [c.slug, c.id]));
}

export function addTransaction(agent, overrides) {
  return agent.post('/api/transactions').send({
    type: 'expense',
    amount: 100,
    title: 'Test',
    date: '2026-11-10T12:00:00Z',
    ...overrides,
  });
}
