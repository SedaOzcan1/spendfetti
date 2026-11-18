import { useState } from 'react';
import { useDeleteBudget, useSaveBudget } from '../../api/budgets.js';
import { Button } from '../../components/ui/Button.jsx';
import { SelectInput, TextInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';

function BudgetForm({ budget, availableCategories, onDone }) {
  const save = useSaveBudget();
  const remove = useDeleteBudget();
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '');
  const [limit, setLimit] = useState(budget ? String(budget.limit) : '');
  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};

  const submit = (event) => {
    event.preventDefault();
    save.mutate({ categoryId, limit: Number(limit) }, { onSuccess: onDone });
  };

  const removeBudget = () => {
    remove.mutate(budget.categoryId, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {!budget && (
        <SelectInput
          label="Category"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="" disabled>
            Choose a category
          </option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectInput>
      )}
      <TextInput
        label="Monthly limit (₺)"
        type="number"
        inputMode="decimal"
        min="1"
        step="1"
        required
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
        error={fieldErrors.limit}
        hint="We’ll warn you when you reach 90% of this limit."
      />

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
          {budget ? 'Save limit' : 'Add budget'}
        </Button>
      </div>
      {budget && (
        <Button variant="danger" onClick={removeBudget} isLoading={remove.isPending}>
          Remove this budget
        </Button>
      )}
    </form>
  );
}

export function BudgetModal({ open, budget, availableCategories, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={budget ? `${budget.category.name} limit` : 'New budget'}
      subtitle="A budget isn’t a restriction, it’s a plan."
    >
      <BudgetForm
        key={budget?.id ?? 'new'}
        budget={budget}
        availableCategories={availableCategories}
        onDone={onClose}
      />
    </Modal>
  );
}
