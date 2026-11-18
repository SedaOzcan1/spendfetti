const VARIANTS = {
  primary: 'bg-coral text-white hover:bg-coral-dark disabled:bg-coral/60',
  secondary: 'border border-line bg-white text-ink hover:bg-subtle',
  mint: 'bg-mint-strong text-forest hover:bg-mint',
  ghost: 'text-ink hover:bg-subtle',
  link: 'px-0 text-sage hover:underline',
  danger: 'px-0 text-coral hover:underline',
};

const SIZES = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  isLoading = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
