import { useId } from 'react';

const inputClass =
  'w-full rounded-lg border border-line bg-white px-4 text-[15px] text-ink placeholder:text-muted/70 focus:border-sage focus:outline-none aria-invalid:border-coral';

const Chevron = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink"
  >
    <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export function Field({ label, error, hint, children, className = '' }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error) || undefined,
        'aria-describedby': describedBy,
      })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-coral">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextInput({ label, error, hint, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(a11y) => <input className={`${inputClass} h-12`} {...a11y} {...props} />}
    </Field>
  );
}

export function TextArea({ label, error, hint, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(a11y) => <textarea className={`${inputClass} min-h-24 py-3`} {...a11y} {...props} />}
    </Field>
  );
}

export function SelectInput({ label, error, hint, className, children, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(a11y) => (
        <div className="relative">
          <select className={`${inputClass} h-12 appearance-none pr-10`} {...a11y} {...props}>
            {children}
          </select>
          <Chevron />
        </div>
      )}
    </Field>
  );
}

/** Compact select used in toolbars (no visible label). */
export function FilterSelect({ label, className = '', children, ...props }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        className="h-12 w-full appearance-none rounded-lg border border-line bg-white pr-10 pl-4 text-[15px] text-ink focus:border-sage focus:outline-none"
        {...props}
      >
        {children}
      </select>
      <Chevron />
    </label>
  );
}
