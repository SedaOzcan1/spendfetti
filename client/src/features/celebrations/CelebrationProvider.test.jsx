import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { confettiFire } from '../../test/setup.js';
import { mockApi, renderWithProviders } from '../../test/utils.jsx';
import { useConfetti } from './CelebrationProvider.jsx';

function Trigger({ preset = 'burst' }) {
  const { celebrate } = useConfetti();
  return (
    <button type="button" onClick={() => celebrate({ preset, message: 'Budget met!' })}>
      Celebrate
    </button>
  );
}

function stubReducedMotion(reduce) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches: reduce && query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  }));
}

async function setup({ confettiEnabled = true, reduce = false, preset } = {}) {
  stubReducedMotion(reduce);
  mockApi({ 'GET /api/auth/me': [200, { user: { id: 'u1', name: 'Ada', confettiEnabled } }] });
  renderWithProviders(<Trigger preset={preset} />);
  // wait for the user (and their preference) to load
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  return userEvent.setup();
}

describe('CelebrationProvider', () => {
  it('fires confetti on a shared, non-interactive, hidden canvas', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));

    await vi.waitFor(() => expect(confettiFire).toHaveBeenCalledTimes(1));
    expect(confettiFire.mock.calls[0][0]).toMatchObject({ particleCount: expect.any(Number) });
    const canvas = screen.getByTestId('confetti-canvas');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(canvas).toHaveClass('pointer-events-none');
  });

  it('announces the achievement to screen readers', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));
    expect(await screen.findByText('Budget met!', { selector: '[aria-live]' })).toBeInTheDocument();
  });

  it('does not animate with prefers-reduced-motion and shows a static message instead', async () => {
    const user = await setup({ reduce: true });
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));

    expect(await screen.findByText('🎉')).toBeInTheDocument();
    expect(confettiFire).not.toHaveBeenCalled();
  });

  it('respects the user setting to turn confetti off', async () => {
    const user = await setup({ confettiEnabled: false });
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));

    expect(await screen.findByText('🎉')).toBeInTheDocument();
    expect(confettiFire).not.toHaveBeenCalled();
  });

  it('fires both cannons', async () => {
    const user = await setup({ preset: 'cannons' });
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));
    await vi.waitFor(() => expect(confettiFire).toHaveBeenCalledTimes(2));
    expect(confettiFire.mock.calls.map(([options]) => options.angle)).toEqual([60, 120]);
  });

  it('uses emoji shapes for the emoji preset', async () => {
    const user = await setup({ preset: 'emoji' });
    await user.click(screen.getByRole('button', { name: 'Celebrate' }));
    await vi.waitFor(() => expect(confettiFire).toHaveBeenCalled());
    expect(confettiFire.mock.calls[0][0].shapes.map((shape) => shape.text)).toEqual(['🎟️', '🎶']);
  });
});
