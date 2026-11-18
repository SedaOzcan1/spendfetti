import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MonthProvider } from '../lib/MonthContext.jsx';

export function renderWithProviders(ui, { route = '/', month = '2026-11' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <MonthProvider initialMonth={month}>{ui}</MonthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const json = (status, body) =>
  Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }));

/**
 * Stubs global fetch with a route table: { 'GET /api/auth/me': [200, body] | fn(request) }.
 * Returns the mock so tests can assert on calls.
 */
export function mockApi(routes) {
  const fetchMock = vi.fn((url, options = {}) => {
    const { pathname } = new URL(url, 'http://localhost');
    const key = `${options.method ?? 'GET'} ${pathname}`;
    const handler = routes[key];
    if (!handler) return json(404, { error: `No mock for ${key}` });
    const [status, body] =
      typeof handler === 'function'
        ? handler({ url, body: options.body && JSON.parse(options.body) })
        : handler;
    return json(status, body);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
