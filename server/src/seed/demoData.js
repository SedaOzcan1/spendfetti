import bcrypt from 'bcryptjs';
import { Budget, Category, Transaction, User } from '../models/index.js';
import { shiftMonth, toMonthKey } from '../utils/month.js';
import { seedDefaultCategories } from './defaultCategories.js';

export const DEMO_USER = {
  name: 'Deniz Yılmaz',
  email: 'demo@spendfetti.app',
  password: 'spendfetti1',
  city: 'Istanbul',
};

// The current month mirrors the design mockups exactly.
const CURRENT_MONTH = [
  {
    day: 1,
    slug: 'salary',
    type: 'income',
    amount: 45000,
    title: 'Salary',
    note: 'Monthly salary',
  },
  { day: 2, slug: 'other-expense', amount: 1500, title: 'Other expenses', note: 'Personal needs' },
  { day: 5, slug: 'transport', amount: 2750, title: 'Transport', note: 'Monthly commute' },
  {
    day: 8,
    slug: 'dining-out',
    amount: 4320,
    title: 'Food & drink',
    note: 'Restaurants and cafés',
  },
  {
    day: 10,
    slug: 'groceries',
    amount: 6654.5,
    title: 'Groceries',
    note: 'Monthly kitchen supplies',
  },
  { day: 12, slug: 'housing', amount: 12000, title: 'Rent', note: 'Monthly rent' },
  { day: 16, slug: 'transport', amount: 250, title: 'Istanbulkart', note: 'Transit card top-up' },
  { day: 17, slug: 'dining-out', amount: 180, title: 'Coffee break', note: 'A small treat' },
  { day: 18, slug: 'groceries', amount: 845.5, title: 'Migros', note: 'Weekly shopping' },
];

// Income / expense totals for the five previous months (oldest first)
const PREVIOUS_MONTHS = [
  { income: 38000, rent: 12000, groceries: 5200, dining: 3100, transport: 2100, other: 700 },
  { income: 40000, rent: 12000, groceries: 8200, dining: 5600, transport: 2900, other: 1300 },
  { income: 41000, rent: 12000, groceries: 7100, dining: 4300, transport: 2600, other: 1000 },
  { income: 40000, rent: 12000, groceries: 9100, dining: 6200, transport: 3200, other: 1500 },
  { income: 42000, rent: 12000, groceries: 7900, dining: 4800, transport: 2600, other: 700 },
];

const BUDGETS = {
  housing: 14000,
  groceries: 9000,
  'dining-out': 5000,
  transport: 4000,
  'other-expense': 3000,
};

const dateIn = (month, day) => new Date(`${month}-${String(day).padStart(2, '0')}T12:00:00Z`);

function previousMonthTransactions(month, totals) {
  return [
    { day: 1, slug: 'salary', type: 'income', amount: totals.income, title: 'Salary' },
    { day: 3, slug: 'housing', amount: totals.rent, title: 'Rent' },
    { day: 6, slug: 'groceries', amount: totals.groceries, title: 'Groceries' },
    { day: 14, slug: 'dining-out', amount: totals.dining, title: 'Food & drink' },
    { day: 9, slug: 'transport', amount: totals.transport, title: 'Transport' },
    { day: 20, slug: 'other-expense', amount: totals.other, title: 'Other expenses' },
  ].map((t) => ({ ...t, date: dateIn(month, t.day) }));
}

/** Creates (or resets) the demo account with six months of sample data. */
export async function seedDemoUser(now = new Date()) {
  await seedDefaultCategories();
  const categories = await Category.find({ userId: null });
  const categoryId = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await User.findOneAndUpdate(
    { email: DEMO_USER.email },
    {
      $set: { name: DEMO_USER.name, city: DEMO_USER.city, passwordHash },
      $setOnInsert: { email: DEMO_USER.email },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  await Promise.all([
    Transaction.deleteMany({ userId: user._id }),
    Budget.deleteMany({ userId: user._id }),
  ]);

  const month = toMonthKey(now);
  const today = now.getUTCDate();
  const current = CURRENT_MONTH.map((t) => ({ ...t, date: dateIn(month, Math.min(t.day, today)) }));
  const previous = PREVIOUS_MONTHS.flatMap((totals, i) =>
    previousMonthTransactions(shiftMonth(month, i - PREVIOUS_MONTHS.length), totals),
  );

  await Transaction.insertMany(
    [...previous, ...current].map(({ slug, type = 'expense', amount, title, note, date }) => ({
      userId: user._id,
      categoryId: categoryId[slug],
      type,
      amount,
      title,
      note,
      date,
    })),
  );

  await Budget.insertMany(
    Object.entries(BUDGETS).map(([slug, limit]) => ({
      userId: user._id,
      categoryId: categoryId[slug],
      limit,
    })),
  );

  return user;
}
