import { useState } from 'react';
import { useSaveBudget } from '../../api/budgets.js';
import { useCreateCategory } from '../../api/categories.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';

const SWATCHES = ['#526a4b', '#d9ad78', '#d95138', '#a6a2c0', '#7e926d', '#6f8fa3', '#c98b6b'];

function CategoryForm({ onDone }) {
  const createCategory = useCreateCategory();
  const saveBudget = useSaveBudget();
  const [name, setName] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [limit, setLimit] = useState('');
  const error = createCategory.error ?? saveBudget.error;
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { category } = await createCategory.mutateAsync({ name, type: 'expense', color });
      if (limit) await saveBudget.mutateAsync({ categoryId: category.id, limit: Number(limit) });
      onDone();
    } catch {
      // Errors are rendered from the mutation state below
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <TextInput
        label="Category name"
        required
        maxLength={40}
        placeholder="e.g. Books"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Color</legend>
        <div className="flex flex-wrap gap-3">
          {SWATCHES.map((swatch) => (
            <label key={swatch} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={swatch}
                checked={color === swatch}
                onChange={() => setColor(swatch)}
                className="peer sr-only"
              />
              <span
                className="block size-9 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-sage"
                style={{ backgroundColor: swatch }}
              />
              <span className="sr-only">{swatch}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextInput
        label="Monthly limit (₺, optional)"
        type="number"
        inputMode="decimal"
        min="1"
        value={limit}
        onChange={(e) => setLimit(e.target.value)}
        error={fieldErrors.limit}
      />

      {error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          isLoading={createCategory.isPending || saveBudget.isPending}
        >
          Create category
        </Button>
      </div>
    </form>
  );
}

export function CategoryModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="A category just for you"
      subtitle="Books, hobbies or a new goal. There’s room for all of it."
    >
      {open && <CategoryForm onDone={onClose} />}
    </Modal>
  );
}
