import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { mockApi, renderWithProviders } from '../../test/utils.jsx';
import { RequireAuth } from './RequireAuth.jsx';

const tree = (
  <Routes>
    <Route path="/login" element={<p>Login screen</p>} />
    <Route element={<RequireAuth />}>
      <Route path="/" element={<p>Private dashboard</p>} />
    </Route>
  </Routes>
);

describe('RequireAuth', () => {
  it('redirects guests to /login', async () => {
    mockApi({ 'GET /api/auth/me': [401, { error: 'Authentication required' }] });
    renderWithProviders(tree);
    expect(await screen.findByText('Login screen')).toBeInTheDocument();
  });

  it('renders private routes for signed-in users', async () => {
    mockApi({ 'GET /api/auth/me': [200, { user: { id: '1', name: 'Ada' } }] });
    renderWithProviders(tree);
    expect(await screen.findByText('Private dashboard')).toBeInTheDocument();
  });
});
