import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../test/utils.jsx';
import ResetPasswordPage from './ResetPasswordPage.jsx';

const route = '/reset-password?token=abcdefghijklmnopqrstuvwxyz123456';

async function fill(user, password, confirm = password) {
  await user.type(screen.getByLabelText('New password', { selector: 'input' }), password);
  await user.type(screen.getByLabelText('Confirm new password', { selector: 'input' }), confirm);
}

describe('ResetPasswordPage', () => {
  it('sends the token with the new password', async () => {
    let sent;
    mockApi({
      'POST /api/auth/reset-password': ({ body }) => {
        sent = body;
        return [204];
      },
    });
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, { route });

    await fill(user, 'brand-new-2');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('heading', { name: 'Password updated.' })).toBeInTheDocument();
    expect(sent).toEqual({ token: 'abcdefghijklmnopqrstuvwxyz123456', password: 'brand-new-2' });
  });

  it('blocks mismatched passwords', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, { route });
    await fill(user, 'brand-new-2', 'brand-new-3');

    expect(screen.getByText('Passwords don’t match')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update password' })).toBeDisabled();
  });

  it('offers a new link when the token is invalid', async () => {
    mockApi({
      'POST /api/auth/reset-password': [
        400,
        { error: 'This reset link is invalid or has expired' },
      ],
    });
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, { route });
    await fill(user, 'brand-new-2');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired');
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('explains when the link has no token', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password' });
    expect(screen.getByRole('heading', { name: 'Link missing.' })).toBeInTheDocument();
  });
});
