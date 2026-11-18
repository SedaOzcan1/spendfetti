import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderWithProviders } from '../test/utils.jsx';
import LoginPage from './LoginPage.jsx';

describe('LoginPage', () => {
  it('sends credentials and shows server errors', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/login': [401, { error: 'Invalid email or password' }],
    });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'wrong-pass-1');
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      email: 'ada@example.com',
      password: 'wrong-pass-1',
      remember: false,
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });
    const input = screen.getByLabelText('Password', { selector: 'input' });

    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
