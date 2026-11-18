export function ProgressBar({ value, color = 'var(--color-sage)', track = 'bg-subtle', label }) {
  const percent = Math.min(Math.max(value, 0), 1) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={`h-1.5 w-full overflow-hidden rounded-full ${track}`}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}
