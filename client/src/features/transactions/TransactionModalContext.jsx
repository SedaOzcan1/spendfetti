import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useCategories } from '../../api/categories.js';
import { useConfetti } from '../celebrations/CelebrationProvider.jsx';
import { useMonth } from '../../lib/MonthContext.jsx';
import { defaultDateForMonth } from '../../lib/month.js';
import { TransactionModal } from './TransactionModal.jsx';

const TransactionModalContext = createContext(null);

export function TransactionModalProvider({ children }) {
  const { month } = useMonth();
  const { celebrate } = useConfetti();
  const { data: categories = [] } = useCategories();
  const [state, setState] = useState({ open: false, transaction: null, defaults: {} });

  const openTransactionModal = useCallback(
    (transaction = null, defaults = {}) => setState({ open: true, transaction, defaults }),
    [],
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const onCreated = useCallback(
    ({ transaction, achievements = [] }) => {
      const category = categories.find((c) => c.id === transaction.categoryId);
      if (achievements.includes('first_transaction')) {
        celebrate({ preset: 'pop', message: 'Your first transaction — great start!' });
      } else if (category?.slug === 'fun-activities') {
        celebrate({
          preset: 'emoji',
          emojis: ['🎟️', '🎶'],
          message: 'Enjoy it — that’s what it’s for!',
        });
      }
    },
    [categories, celebrate],
  );
  const value = useMemo(() => ({ openTransactionModal }), [openTransactionModal]);

  return (
    <TransactionModalContext.Provider value={value}>
      {children}
      <TransactionModal
        open={state.open}
        transaction={state.transaction}
        defaults={{ date: defaultDateForMonth(month), ...state.defaults }}
        onClose={close}
        onCreated={onCreated}
      />
    </TransactionModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives with its provider
export function useTransactionModal() {
  const context = useContext(TransactionModalContext);
  if (!context) throw new Error('useTransactionModal must be used inside its provider');
  return context;
}
