import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { mockApi, renderWithProviders } from '../../test/utils.jsx';
import { FunBudgetPromptModal } from './FunBudgetPromptModal.jsx';

const prompt = { show: true, reason: null, balance: 16500, ratio: 0.2, suggestedAmount: 3300 };

function setup() {
  const onClose = vi.fn();
  renderWithProviders(
    <Routes>
      <Route path="/" element={<FunBudgetPromptModal open month="2026-11" onClose={onClose} />} />
      <Route path="/activities" element={<p>Activities page</p>} />
    </Routes>,
  );
  return { onClose, user: userEvent.setup() };
}

describe('FunBudgetPromptModal', () => {
  it('suggests an amount and allocates it, then opens activities', async () => {
    let sent;
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
      'POST /api/fun-budget': ({ body }) => {
        sent = body;
        return [201, { status: 'allocated', allocated: body.amount }];
      },
    });
    const { user } = setup();

    expect(
      await screen.findByRole('heading', { name: 'You saved ₺16,500 this month!' }),
    ).toBeVisible();
    const amount = screen.getByLabelText('Fun & activities budget');
    expect(amount).toHaveValue(3300);

    await user.clear(amount);
    await user.type(amount, '2500');
    await user.click(screen.getByRole('button', { name: /Yes, set it aside/ }));

    expect(await screen.findByText('Activities page')).toBeInTheDocument();
    expect(sent).toEqual({ month: '2026-11', amount: 2500 });
  });

  it('dismisses with "don’t ask again"', async () => {
    let sent;
    mockApi({
      'GET /api/fun-budget/prompt': [200, prompt],
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
