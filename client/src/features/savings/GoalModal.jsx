import { useState } from 'react';
import { useDeleteGoal, useSaveGoal } from '../../api/savings.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';
import { toDateInputValue } from '../../lib/format.js';
import { GOAL_KIND_LABELS } from './goalKinds.js';

const SUGGESTIONS = [
  { name: 'Emergency fund', kind: 'savings' },
  { name: 'Index fund', kind: 'investment' },
  { name: 'Holiday', kind: 'savings' },
  { name: 'Gold', kind: 'investment' },
];

function GoalForm({ goal, onDone }) {
  const save = useSaveGoal();
  const remove = useDeleteGoal();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: goal?.name ?? '',
    kind: goal?.kind ?? 'savings',
    targetAmount: goal ? String(goal.targetAmount) : '',
    targetDate: goal?.targetDate ? toDateInputValue(goal.targetDate) : '',
  });
  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    save.mutate(
      {
        id: goal?.id,
        name: form.name,
        kind: form.kind,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate ? `${form.targetDate}T00:00:00.000Z` : goal ? null : undefined,
      },
      { onSuccess: () => onDone() },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {!goal && (
        <div className="flex flex-wrap gap-2" aria-label="Suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setForm((f) => ({ ...f, ...s }))}
              className="rounded-full bg-subtle px-3 py-1.5 text-sm text-ink/80 hover:bg-nav-active"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <TextInput
        label="Goal name"
        required
        maxLength={60}
        value={form.name}
        onChange={set('name')}
        error={fieldErrors.name}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Type</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1.5">
          {Object.entries(GOAL_KIND_LABELS).map(([value, label]) => (
            <label
              key={value}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-lg text-[15px] has-focus-visible:ring-2 has-focus-visible:ring-sage ${
                form.kind === value ? 'bg-white font-semibold text-ink shadow-sm' : 'text-muted'
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={form.kind === value}
                onChange={set('kind')}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Target amount (₺)"
          type="number"
          min="1"
          step="1"
          required
          value={form.targetAmount}
          onChange={set('targetAmount')}
          error={fieldErrors.targetAmount}
        />
        <TextInput
          label="Target date (optional)"
          type="date"
          value={form.targetDate}
          onChange={set('targetDate')}
          error={fieldErrors.targetDate}
        />
      </div>

      {save.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {save.error.message}
        </p>
      )}

      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="lg" isLoading={save.isPending}>
          {goal ? 'Save goal' : 'Create goal'}
        </Button>
      </div>

      {goal &&
        (confirmDelete ? (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-ink">Delete this goal and its history?</span>
            <Button
              variant="danger"
              onClick={() => remove.mutate(goal.id, { onSuccess: onDone })}
              isLoading={remove.isPending}
            >
              Yes, delete
            </Button>
            <Button variant="link" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete goal
          </Button>
        ))}
    </form>
  );
}

export function GoalModal({ open, goal, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? 'Edit goal' : 'New goal'}
      subtitle="Give your money a purpose."
    >
      {open && <GoalForm goal={goal} onDone={onClose} />}
    </Modal>
  );
}
