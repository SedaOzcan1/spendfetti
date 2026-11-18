import { Category, FUN_CATEGORY_SLUG } from '../models/index.js';

// Colors follow the design palette (see client/src/theme/colors.js)
export const DEFAULT_CATEGORIES = [
  { slug: 'housing', name: 'Rent', type: 'expense', icon: '🏠', color: '#526a4b' },
  { slug: 'groceries', name: 'Groceries', type: 'expense', icon: '🛒', color: '#d9ad78' },
  { slug: 'dining-out', name: 'Food & Drink', type: 'expense', icon: '☕', color: '#d95138' },
  { slug: 'transport', name: 'Transport', type: 'expense', icon: '🚌', color: '#a6a2c0' },
  { slug: 'bills', name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#7e926d' },
  { slug: 'health', name: 'Health', type: 'expense', icon: '🩺', color: '#ebb39e' },
  { slug: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#c98b6b' },
  { slug: 'education', name: 'Education', type: 'expense', icon: '📚', color: '#6f8fa3' },
  {
    slug: FUN_CATEGORY_SLUG,
    name: 'Fun & Activities',
    type: 'expense',
    icon: '🎉',
    color: '#253d33',
  },
  { slug: 'other-expense', name: 'Other', type: 'expense', icon: '📦', color: '#d5d9cc' },
  { slug: 'salary', name: 'Salary', type: 'income', icon: '💼', color: '#526a4b' },
  { slug: 'freelance', name: 'Freelance', type: 'income', icon: '🧑‍💻', color: '#7e926d' },
  { slug: 'gifts', name: 'Gifts', type: 'income', icon: '🎁', color: '#d9ad78' },
  { slug: 'other-income', name: 'Other', type: 'income', icon: '💰', color: '#d5d9cc' },
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
