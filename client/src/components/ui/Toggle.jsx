export function Toggle({ checked, onChange, label, description, id }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p id={`${id}-label`} className="text-[15px] font-medium text-ink">
          {label}
        </p>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-sage' : 'bg-stone'}`}
      >
        <span
          className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
