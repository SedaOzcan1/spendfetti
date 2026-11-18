import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { mockApi, renderWithProviders } from '../../test/utils.jsx';
import { TransactionModal } from './TransactionModal.jsx';

const categories = [
  { id: 'c1', name: 'Groceries', type: 'expense', slug: 'groceries' },
  { id: 'c2', name: 'Salary', type: 'income', slug: 'salary' },
];

function setup(props = {}) {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  renderWithProviders(
    <TransactionModal
      open
      transaction={null}
      defaults={{ date: '2026-11-18' }}
      onClose={onClose}
      onCreated={onCreated}
      {...props}
    />,
  );
  return { onClose, onCreated, user: userEvent.setup() };
}

describe('TransactionModal', () => {
  it('only offers categories matching the selected type', async () => {
    mockApi({ 'GET /api/categories': [200, { categories }] });
    const { user } = setup();
    const select = screen.getByLabelText('Category');

    expect(await within(select).findByRole('option', { name: 'Groceries' })).toBeInTheDocument();
    expect(within(select).queryByRole('option', { name: 'Salary' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Income' }));
    expect(within(select).getByRole('option', { name: 'Salary' })).toBeInTheDocument();
    expect(within(select).queryByRole('option', { name: 'Groceries' })).not.toBeInTheDocument();
  });

  it('creates a transaction and closes', async () => {
    let sent;
    mockApi({
      'GET /api/categories': [200, { categories }],
      'POST /api/transactions': ({ body }) => {
        sent = body;
        return [201, { transaction: { id: 't1', ...body } }];
      },
    });
    const { user, onClose, onCreated } = setup();

    await user.type(screen.getByLabelText('Amount'), '845.5');
    await user.type(screen.getByLabelText('Name'), 'Migros');
    await screen.findByRole('option', { name: 'Groceries' });
    await user.selectOptions(screen.getByLabelText('Category'), 'c1');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onCreated).toHaveBeenCalled();
    expect(sent).toMatchObject({
      type: 'expense',
      amount: 845.5,
      title: 'Migros',
      categoryId: 'c1',
      date: '2026-11-18T12:00:00.000Z',
    });
  });

  it('shows field errors from the API', async () => {
    mockApi({
      'GET /api/categories': [200, { categories }],
      'POST /api/transactions': [
        400,
        { error: 'Validation failed', details: [{ path: 'title', message: 'Too long' }] },
      ],
    });
    const { user } = setup();

    await user.type(screen.getByLabelText('Amount'), '10');
    await user.type(screen.getByLabelText('Name'), 'x');
    await screen.findByRole('option', { name: 'Groceries' });
    await user.selectOptions(screen.getByLabelText('Category'), 'c1');
    await user.click(screen.getByRole('button', { name: 'Add transaction' }));

    expect(await screen.findByText('Too long')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting', async () => {
    const fetchMock = mockApi({
      'GET /api/categories': [200, { categories }],
      'DELETE /api/transactions/t1': [204],
    });
    const { user, onClose } = setup({
      transaction: {
        id: 't1',
        type: 'expense',
        amount: 10,
        title: 'Migros',
        categoryId: 'c1',
        date: '2026-11-18T12:00:00.000Z',
      },
    });

    await user.click(screen.getByRole('button', { name: 'Delete transaction' }));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/t1'), expect.anything());

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
