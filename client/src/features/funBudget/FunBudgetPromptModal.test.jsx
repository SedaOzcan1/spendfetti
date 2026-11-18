import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { confettiFire } from '../../test/setup.js';
import { mockApi, renderWithProviders } from '../../test/utils.jsx';
import { FunBudgetPromptModal } from './FunBudgetPromptModal.jsx';

const prompt = {
  show: true,
  reason: null,
  balance: 16500,
  ratio: 0.2,
  suggestedAmount: 3300,
  savingsRatio: 0.5,
  suggestedSavings: 8250,
};
const savings = {
  goals: [
    { id: 'g1', name: 'Emergency fund', kind: 'savings', achievedAt: null },
    { id: 'g2', name: 'Index fund', kind: 'investment', achievedAt: null },
  ],
};

function setup() {
  const onClose = vi.fn();
  renderWithProviders(
    <Routes>
      <Route path="/" element={<FunBudgetPromptModal open month="2026-11" onClose={onClose} />} />
      <Route path="/activities" element={<p>Activities page</p>} />
      <Route path="/savings" element={<p>Savings page</p>} />
    </Routes>,
  );
  return { onClose, user: userEvent.setup() };
}

describe('FunBudgetPromptModal', () => {
  it('splits the surplus between fun and a savings goal, then opens activities', async () => {
    let sent;
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'GET /api/savings': [200, savings],
      'POST /api/savings/month-close': ({ body }) => {
        sent = body;
        return [201, { goalsReached: [] }];
      },
    });
    const { user } = setup();

    expect(
      await screen.findByRole('heading', { name: 'You saved ₺16,500 this month!' }),
    ).toBeVisible();
    const fun = screen.getByLabelText('Fun & activities budget');
    expect(fun).toHaveValue(3300);
    const save = await screen.findByLabelText('Savings & investments');
    expect(save).toHaveValue(8250);
    expect(screen.getByText('₺4,950 stays in your account.')).toBeInTheDocument();

    await user.clear(fun);
    await user.type(fun, '2500');
    await user.selectOptions(screen.getByLabelText('Into goal'), 'g2');
    await user.click(screen.getByRole('button', { name: /Set it aside and explore/ }));

    expect(await screen.findByText('Activities page')).toBeInTheDocument();
    expect(sent).toEqual({
      month: '2026-11',
      funAmount: 2500,
      savings: [{ goalId: 'g2', amount: 8250 }],
    });
  });

  it('goes to savings when nothing is set aside for fun', async () => {
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'GET /api/savings': [200, savings],
      'POST /api/savings/month-close': [201, { goalsReached: [] }],
    });
    const { user } = setup();
    const fun = await screen.findByLabelText('Fun & activities budget');
    await screen.findByLabelText('Savings & investments');
    await user.clear(fun);
    await user.click(screen.getByRole('button', { name: 'Save it' }));
    expect(await screen.findByText('Savings page')).toBeInTheDocument();
  });

  it('blocks splits larger than the surplus', async () => {
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'GET /api/savings': [200, savings],
    });
    const { user } = setup();
    const save = await screen.findByLabelText('Savings & investments');
    await user.clear(save);
    await user.type(save, '14000');

    expect(screen.getByText('That’s ₺800 more than you saved.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Set it aside/ })).toBeDisabled();
  });

  it('invites the user to create a goal when there is none', async () => {
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'GET /api/savings': [200, { goals: [] }],
    });
    setup();
    expect(await screen.findByRole('link', { name: 'Create a goal' })).toHaveAttribute(
      'href',
      '/savings',
    );
  });

  it('bursts confetti once when the popup opens and marks month_positive as seen', async () => {
    let seen;
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'GET /api/savings': [200, savings],
      'POST /api/achievements/seen': ({ body }) => {
        seen = body;
        return [204];
      },
    });
    setup();

    await screen.findByRole('heading', { name: /You saved/ });
    await vi.waitFor(() => expect(confettiFire).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(seen).toEqual({ month: '2026-11', keys: ['month_positive'] }));
  });

  it('dismisses with "don’t ask again"', async () => {
    let sent;
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'GET /api/savings': [200, savings],
      'POST /api/fun-budget': ({ body }) => {
        sent = body;
        return [200, { status: 'dismissed' }];
      },
    });
    const { user, onClose } = setup();

    await user.click(await screen.findByRole('checkbox', { name: 'Don’t ask me again' }));
    await user.click(screen.getByRole('button', { name: 'Not now' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual({ month: '2026-11', dismissed: true, neverAsk: true });
  });

  it('explains why there is nothing to set aside', async () => {
    mockApi({
      'GET /api/fun-budget/prompt': [200, { ...prompt, show: false, reason: 'no_surplus' }],
    });
    setup();
    expect(await screen.findByText(/didn’t end with a surplus/)).toBeInTheDocument();
  });
});
