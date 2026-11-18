import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { confettiFire } from '../test/setup.js';
import { mockApi, renderWithProviders } from '../test/utils.jsx';
import SavingsPage from './SavingsPage.jsx';

const goal = {
  id: 'g1',
  name: 'Emergency fund',
  kind: 'savings',
  targetAmount: 10000,
  saved: 9500,
  remaining: 500,
  progress: 0.95,
  targetDate: '2027-05-01T00:00:00.000Z',
  monthsLeft: 6,
  monthlyNeeded: 84,
  achievedAt: null,
};
const overview = {
  totalSaved: 9500,
  byKind: { savings: 9500, investment: 0 },
  savedThisMonth: 1000,
  goalsReached: 0,
  goals: [goal],
};

describe('SavingsPage', () => {
  it('shows totals and goal progress', async () => {
    mockApi({
      'GET /api/savings': [200, overview],
      'GET /api/savings/entries': [200, { entries: [] }],
    });
    renderWithProviders(<SavingsPage />);

    const card = (await screen.findByRole('heading', { name: 'Emergency fund' })).closest(
      'section',
    );
    expect(within(card).getByText('95%')).toBeInTheDocument();
    expect(within(card).getByText('₺84/month to reach it by May 2027')).toBeInTheDocument();
    expect(screen.getByText('Total saved').closest('section')).toHaveTextContent('₺9,500');
  });

  it('adds money and celebrates when the goal is reached', async () => {
    let sent;
    mockApi({
      'GET /api/savings': [200, overview],
      'GET /api/savings/entries': [200, { entries: [] }],
      'POST /api/savings/entries': ({ body }) => {
        sent = body;
        return [201, { goalReached: true, goal: { ...goal, saved: 10000 } }];
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<SavingsPage />);

    await user.click(await screen.findByRole('button', { name: 'Add money' }));
    const dialog = screen.getByRole('dialog');
    const amount = within(dialog).getByLabelText('Amount (₺)');
    expect(amount).toHaveValue(84);
    await user.clear(amount);
    await user.type(amount, '500');
    await user.click(within(dialog).getByRole('button', { name: 'Add money' }));

    await vi.waitFor(() => expect(confettiFire).toHaveBeenCalled());
    expect(sent).toEqual({ goalId: 'g1', type: 'deposit', amount: 500 });
  });

  it('shows an empty state with a call to action', async () => {
    mockApi({
      'GET /api/savings': [200, { ...overview, totalSaved: 0, goals: [] }],
      'GET /api/savings/entries': [200, { entries: [] }],
    });
    renderWithProviders(<SavingsPage />);
    expect(await screen.findByRole('heading', { name: 'Start your first goal' })).toBeVisible();
  });
});
