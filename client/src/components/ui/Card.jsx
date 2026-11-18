const TONES = {
  white: 'border border-line bg-white',
  mint: 'bg-mint',
  forest: 'bg-forest text-white',
  muted: 'bg-sidebar',
};

export function Card({ tone = 'white', className = '', as: Tag = 'section', children, ...props }) {
  return (
    <Tag className={`rounded-2xl ${TONES[tone]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
