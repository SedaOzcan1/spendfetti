import { useState } from 'react';
import { useDecideFunBudget } from '../../api/funBudget.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';

function EditForm({ month, current, onDone }) {
  const decide = useDecideFunBudget();
  const [amount, setAmount] = useState(String(current));
  const fieldErrors = decide.error instanceof ApiError ? decide.error.fieldErrors : {};

  const submit = (event) => {
    event.preventDefault();
    decide.mutate({ month, amount: Number(amount) }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <TextInput
        label="Fun budget (₺)"
        type="number"
        min="1"
        step="1"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={fieldErrors.amount}
        hint="Up to what you saved this month."
      />
      {decide.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {decide.error.message}
        </p>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="lg" isLoading={decide.isPending}>
          Save budget
        </Button>
      </div>
    </form>
  );
}

export function EditFunBudgetModal({ open, month, current, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit fun budget"
      subtitle="Make room for good moments."
    >
      {open && <EditForm month={month} current={current} onDone={onClose} />}
    </Modal>
  );
}
