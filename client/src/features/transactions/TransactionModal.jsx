import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useCategories } from '../../api/categories.js';
import { useDeleteTransaction, useSaveTransaction } from '../../api/transactions.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';
import { toDateInputValue } from '../../lib/format.js';

const emptyForm = (defaults) => ({
  type: 'expense',
  amount: '',
  title: '',
  categoryId: '',
  date: defaults.date,
  note: '',
  ...defaults,
});

function TypeSwitch({ value, onChange }) {
  const options = [
    { value: 'expense', label: 'Expense', Icon: ArrowUpRight, active: 'text-coral' },
    { value: 'income', label: 'Income', Icon: ArrowDownLeft, active: 'text-income' },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Type"
      className="grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1.5"
    >
      {options.map(({ value: optionValue, label, Icon, active }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-[15px] transition-colors ${
              selected ? `bg-white font-semibold shadow-sm ${active}` : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function TransactionForm({ transaction, defaults, onDone }) {
  const isEdit = Boolean(transaction);
  const { data: categories = [] } = useCategories();
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...transaction,
          amount: String(transaction.amount),
          note: transaction.note ?? '',
          date: toDateInputValue(transaction.date),
        }
      : emptyForm(defaults),
  );

  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const typeCategories = categories.filter((c) => c.type === form.type);
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const changeType = (type) =>
    setForm((f) => ({
      ...f,
      type,
      categoryId: categories.find((c) => c.id === f.categoryId)?.type === type ? f.categoryId : '',
    }));

  const submit = (event) => {
    event.preventDefault();
    save.mutate(
      {
        id: transaction?.id,
        type: form.type,
        amount: Number(form.amount),
        title: form.title,
        categoryId: form.categoryId,
        date: new Date(`${form.date}T12:00:00Z`).toISOString(),
        note: form.note || undefined,
      },
      { onSuccess: (result) => onDone({ created: !isEdit, result }) },
    );
  };

  const deleteTransaction = () => {
    remove.mutate(transaction.id, { onSuccess: () => onDone({ created: false }) });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <TypeSwitch value={form.type} onChange={changeType} />

      <Field label="Amount" error={fieldErrors.amount}>
        {(a11y) => (
          <div className="flex h-20 items-center rounded-lg border border-line bg-white px-5 focus-within:border-sage">
            <span className="text-3xl font-bold text-ink" aria-hidden="true">
              ₺
            </span>
            <input
              {...a11y}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={set('amount')}
              className="w-full bg-transparent pl-1 text-3xl font-bold text-ink tabular-nums placeholder:text-muted/50 focus:outline-none"
            />
          </div>
        )}
      </Field>

      <TextInput
        label="Name"
        required
        maxLength={80}
        placeholder="e.g. Migros"
        value={form.title}
        onChange={set('title')}
        error={fieldErrors.title}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectInput
          label="Category"
          required
          value={form.categoryId}
          onChange={set('categoryId')}
          error={fieldErrors.categoryId}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {typeCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectInput>
        <TextInput
          label="Date"
          type="date"
          required
          value={form.date}
          onChange={set('date')}
          error={fieldErrors.date}
        />
      </div>

      <TextArea
        label="Note"
        maxLength={500}
        placeholder="Optional"
        value={form.note}
        onChange={set('note')}
        error={fieldErrors.note}
      />

      {save.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {save.error.message}
        </p>
      )}

      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-3">
        <Button variant="secondary" size="lg" onClick={() => onDone({ created: false })}>
          Cancel
        </Button>
        <Button type="submit" size="lg" isLoading={save.isPending}>
          {isEdit ? 'Save changes' : 'Add transaction'}
        </Button>
      </div>

      {isEdit &&
        (confirmDelete ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink">Delete this transaction?</span>
            <Button variant="danger" onClick={deleteTransaction} isLoading={remove.isPending}>
              Yes, delete
            </Button>
            <Button variant="link" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete transaction
          </Button>
        ))}
    </form>
  );
}

export function TransactionModal({ open, transaction, defaults, onClose, onCreated }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit transaction' : 'New transaction'}
      subtitle="Small details, a clear picture."
    >
      <TransactionForm
        key={transaction?.id ?? 'new'}
        transaction={transaction}
        defaults={defaults}
        onDone={({ created, result }) => {
          onClose();
          if (created) onCreated?.(result);
        }}
      />
    </Modal>
  );
}
