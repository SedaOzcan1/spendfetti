import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { TransactionModalProvider } from '../features/transactions/TransactionModalContext.jsx';
import { mockApi, renderWithProviders } from '../test/utils.jsx';
import ActivitiesPage from './ActivitiesPage.jsx';

const events = [
  {
    id: 'e1',
    title: 'A night of jazz',
    type: 'concert',
    city: 'Istanbul',
    venue: 'Kadıköy Stage',
    startsAt: '2026-11-20T17:30:00.000Z',
    minPrice: 650,
    imageUrl: '/events/concert.svg',
    url: 'https://example.com/jazz',
  },
  {
    id: 'e2',
    title: 'Festival pass',
    type: 'festival',
    city: 'Istanbul',
    venue: 'Moda',
    startsAt: '2026-11-21T11:00:00.000Z',
    minPrice: 2000,
    imageUrl: '/events/festival.svg',
    url: 'https://example.com/fest',
  },
];

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="search">{location.search}</output>;
}

function setup({ route = '/activities', funBudget } = {}) {
  const requests = [];
  mockApi({
    'GET /api/auth/me': [200, { user: { id: 'u1', name: 'Ada', city: 'Istanbul' } }],
    'GET /api/categories': [
      200,
      {
        categories: [
          { id: 'fun', slug: 'fun-activities', name: 'Fun & Activities', type: 'expense' },
        ],
      },
    ],
    'GET /api/events/meta': [200, { cities: ['Ankara', 'Istanbul'], types: [] }],
    'GET /api/fun-budget': [
      200,
      funBudget ?? { status: 'allocated', allocated: 1500, spent: 300, remaining: 1200 },
    ],
    'GET /api/summary': [200, { budgets: [] }],
    'GET /api/events': ({ url }) => {
      requests.push(new URL(url, 'http://localhost').searchParams);
      return [200, { items: events, page: 1, limit: 12, total: 2, hasMore: false }];
    },
  });
  renderWithProviders(
    <TransactionModalProvider>
      <Routes>
        <Route
          path="/activities"
          element={
            <>
              <ActivitiesPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </TransactionModalProvider>,
    { route },
  );
  return { requests, user: userEvent.setup() };
}

describe('ActivitiesPage', () => {
  it('shows the fun budget and filters within it by default', async () => {
    const { requests } = setup();

    expect(await screen.findByText('A night of jazz')).toBeInTheDocument();
    expect(screen.getByText('Left to explore').nextSibling).toHaveTextContent('₺1,200');
    const last = requests.at(-1);
    expect(last.get('withinBudget')).toBe('true');
    expect(last.get('city')).toBe('Istanbul');
    expect(last.get('month')).toBeTruthy();
  });

  it('keeps filters in the URL and shows over-budget badges when the toggle is off', async () => {
    const { user, requests } = setup();
    await screen.findByText('A night of jazz');

    await user.click(screen.getByRole('switch', { name: /Within my budget/ }));
    await user.click(screen.getByRole('button', { name: 'Workshop' }));

    expect(screen.getByTestId('search')).toHaveTextContent('budget=0');
    expect(screen.getByTestId('search')).toHaveTextContent('type=workshop');
    expect(requests.at(-1).get('withinBudget')).toBeNull();
    expect(requests.at(-1).get('type')).toBe('workshop');
    expect(await screen.findByText('₺800 over your budget')).toBeInTheDocument();
  });

  it('restores filters from the URL', async () => {
    const { requests } = setup({ route: '/activities?city=Ankara&sort=price&free=1' });
    await screen.findByText('A night of jazz');
    const last = requests.at(-1);
    expect(last.get('city')).toBe('Ankara');
    expect(last.get('sort')).toBe('price');
    expect(last.get('free')).toBe('true');
  });

  it('opens ticket links safely in a new tab', async () => {
    setup();
    const card = (await screen.findByText('A night of jazz')).closest('article');
    const link = within(card).getByRole('link', { name: /Tickets \/ Details/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('pre-fills an expense from an event', async () => {
    const { user } = setup();
    const card = (await screen.findByText('A night of jazz')).closest('article');
    await user.click(within(card).getByRole('button', { name: '+ Add as expense' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Amount')).toHaveValue(650);
    expect(within(dialog).getByLabelText('Name')).toHaveValue('A night of jazz');
    expect(within(dialog).getByLabelText('Category')).toHaveValue('fun');
  });

  it('invites the user to close the month when nothing is set aside', async () => {
    setup({ funBudget: { status: 'none', allocated: 0, spent: 0, remaining: 0 } });
    expect(await screen.findByRole('button', { name: 'Close the month' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Within my budget/ })).toBeDisabled();
  });
});
