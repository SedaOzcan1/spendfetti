import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Field } from '../../components/ui/Field.jsx';

export function PasswordInput({ label = 'Password', error, hint, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => (
        <div className="relative">
          <input
            {...a11y}
            {...props}
            type={visible ? 'text' : 'password'}
            className="h-12 w-full rounded-lg border border-line bg-white pr-12 pl-4 text-[15px] text-ink focus:border-sage focus:outline-none aria-invalid:border-coral"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      )}
    </Field>
  );
}
