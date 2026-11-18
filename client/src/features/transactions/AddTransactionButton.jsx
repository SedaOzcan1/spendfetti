import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { useTransactionModal } from './TransactionModalContext.jsx';

export function AddTransactionButton() {
  const { openTransactionModal } = useTransactionModal();
  return (
    <Button
      size="lg"
      className="w-full sm:w-auto sm:min-w-52"
      onClick={() => openTransactionModal()}
    >
      <Plus className="size-5" aria-hidden="true" /> Add transaction
    </Button>
  );
}
