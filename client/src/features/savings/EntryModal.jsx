import { useState } from 'react';
import { useAddSavingsEntry } from '../../api/savings.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';
import { formatMoney } from '../../lib/format.js';
import { useConfetti } from '../celebrations/CelebrationProvider.jsx';

function EntryForm({ goal, type, onDone }) {
  const add = useAddSavingsEntry();
  const { celebrate } = useConfetti();
  const [amount, setAmount] = useState(
    type === 'deposit' && goal.monthlyNeeded ? String(goal.monthlyNeeded) : '',
  );
  const [note, setNote] = useState('');
  const fieldErrors = add.error instanceof ApiError ? add.error.fieldErrors : {};

  const submit = (event) => {
    event.preventDefault();
    add.mutate(
      { goalId: goal.id, type, amount: Number(amount), note: note || undefined },
      {
        onSuccess: ({ goalReached }) => {
          if (goalReached) {
            celebrate({ preset: 'burst', message: `You reached “${goal.name}”!` });
          }
          onDone();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="rounded-lg bg-subtle px-4 py-3 text-sm text-muted">
        Saved so far:{' '}
        <strong className="text-ink">{formatMoney(goal.saved, { decimals: 0 })}</strong> of{' '}
        {formatMoney(goal.targetAmount, { decimals: 0 })}
      </p>
      <TextInput
        label="Amount (₺)"
        type="number"
        min="0.01"
        step="0.01"
        max={type === 'withdrawal' ? goal.saved : undefined}
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={fieldErrors.amount}
        hint={
          type === 'deposit' && goal.monthlyNeeded
            ? `${formatMoney(goal.monthlyNeeded, { decimals: 0 })}/month keeps you on track.`
            : undefined
        }
      />
      <TextInput
        label="Note (optional)"
        maxLength={200}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {add.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {add.error.message}
        </p>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="lg" isLoading={add.isPending}>
          {type === 'deposit' ? 'Add money' : 'Withdraw'}
        </Button>
      </div>
    </form>
  );
}

export function EntryModal({ goal, type, onClose }) {
  return (
    <Modal
      open={Boolean(goal)}
      onClose={onClose}
      title={
        type === 'deposit' ? `Add to ${goal?.name ?? ''}` : `Withdraw from ${goal?.name ?? ''}`
      }
    >
      {goal && <EntryForm goal={goal} type={type} onDone={onClose} />}
    </Modal>
  );
}
