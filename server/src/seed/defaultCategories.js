import { Category, FUN_CATEGORY_SLUG } from '../models/index.js';

export const DEFAULT_CATEGORIES = [
  { slug: 'groceries', name: 'Groceries', type: 'expense', icon: '🛒', color: '#10b981' },
  { slug: 'dining-out', name: 'Dining Out', type: 'expense', icon: '🍽️', color: '#f97316' },
  { slug: 'transport', name: 'Transport', type: 'expense', icon: '🚌', color: '#0ea5e9' },
  { slug: 'housing', name: 'Housing', type: 'expense', icon: '🏠', color: '#6366f1' },
  { slug: 'bills', name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#eab308' },
  { slug: 'health', name: 'Health', type: 'expense', icon: '🩺', color: '#ef4444' },
  { slug: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { slug: 'education', name: 'Education', type: 'expense', icon: '📚', color: '#14b8a6' },
  {
    slug: FUN_CATEGORY_SLUG,
    name: 'Fun & Activities',
    type: 'expense',
    icon: '🎉',
    color: '#7c3aed',
  },
  { slug: 'other-expense', name: 'Other', type: 'expense', icon: '📦', color: '#64748b' },
  { slug: 'salary', name: 'Salary', type: 'income', icon: '💼', color: '#22c55e' },
  { slug: 'freelance', name: 'Freelance', type: 'income', icon: '🧑‍💻', color: '#06b6d4' },
  { slug: 'gifts', name: 'Gifts', type: 'income', icon: '🎁', color: '#f43f5e' },
  { slug: 'other-income', name: 'Other', type: 'income', icon: '💰', color: '#84cc16' },
];

/** Idempotently upserts the built-in categories (keyed by slug). */
export async function seedDefaultCategories() {
  await Category.bulkWrite(
    DEFAULT_CATEGORIES.map((category) => ({
      updateOne: {
        filter: { slug: category.slug },
        update: { $set: { ...category, userId: null } },
        upsert: true,
      },
    })),
  );
}
