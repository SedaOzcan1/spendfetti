import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { mockApi, renderWithProviders } from '../../test/utils.jsx';
import { NotificationBell } from './NotificationBell.jsx';

const now = new Date().toISOString();
const items = [
  {
    id: 'n1',
    type: 'budget_warning',
    title: 'Food & Drink is close to its limit',
    body: '₺4,500 of ₺5,000 spent in November. ₺500 left.',
    link: '/budgets',
    read: false,
    createdAt: now,
  },
  {
    id: 'n2',
    type: 'welcome',
    title: 'Welcome to Spendfetti 🎉',
    link: '/transactions',
    read: true,
    createdAt: now,
  },
];

function setup(overrides = {}) {
  const calls = [];
  const record = (name, response) => (req) => {
    calls.push(name);
    return response(req);
  };
  mockApi({
    'GET /api/notifications/unread-count': [200, { unreadCount: 1 }],
    'GET /api/notifications': [200, { items, unreadCount: 1, nextCursor: null }],
    'PATCH /api/notifications/n1/read': record('read:n1', () => [200, { unreadCount: 0 }]),
    'POST /api/notifications/read-all': record('read-all', () => [200, { unreadCount: 0 }]),
    'DELETE /api/notifications/n2': record('delete:n2', () => [204]),
    ...overrides,
  });
  renderWithProviders(
    <Routes>
      <Route path="/" element={<NotificationBell />} />
      <Route path="/budgets" element={<p>Budgets page</p>} />
    </Routes>,
  );
  return { calls, user: userEvent.setup() };
}

describe('NotificationBell', () => {
  it('shows the unread count and lists notifications', async () => {
    const { user } = setup();
    const bell = await screen.findByRole('button', { name: 'Notifications, 1 unread' });
    expect(bell).toHaveAttribute('aria-expanded', 'false');

    await user.click(bell);
    const panel = screen.getByRole('dialog', { name: 'Notifications' });
    expect(await within(panel).findByText('Food & Drink is close to its limit')).toBeVisible();
    expect(within(panel).getByText('Welcome to Spendfetti 🎉')).toBeVisible();
    expect(within(panel).getAllByText('just now')).toHaveLength(2);
  });

  it('marks a notification read and follows its link', async () => {
    const { user, calls } = setup();
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByText('Food & Drink is close to its limit'));

    expect(await screen.findByText('Budgets page')).toBeInTheDocument();
    await vi.waitFor(() => expect(calls).toContain('read:n1'));
  });

  it('marks all as read and dismisses items', async () => {
    const { user, calls } = setup();
    await user.click(await screen.findByRole('button', { name: /Notifications/ }));
    await screen.findByText('Welcome to Spendfetti 🎉');

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss "Welcome to Spendfetti 🎉"' }));
    await vi.waitFor(() => expect(calls).toEqual(['read-all', 'delete:n2']));
  });

  it('closes with Escape and returns focus to the bell', async () => {
    const { user } = setup();
    const bell = await screen.findByRole('button', { name: /Notifications/ });
    await user.click(bell);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(bell).toHaveFocus();
  });

  it('shows an empty state', async () => {
    const { user } = setup({
      'GET /api/notifications/unread-count': [200, { unreadCount: 0 }],
      'GET /api/notifications': [200, { items: [], unreadCount: 0, nextCursor: null }],
    });
    await user.click(await screen.findByRole('button', { name: 'Notifications' }));
    expect(await screen.findByText('You’re all caught up.')).toBeInTheDocument();
  });
});
