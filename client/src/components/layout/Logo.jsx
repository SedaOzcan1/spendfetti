export function Logo({ inverted = false, showTagline = true }) {
  return (
    <div>
      <p
        className={`relative inline-block text-[28px] leading-none font-bold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}
      >
        spendfetti
        <span
          aria-hidden="true"
          className="absolute -top-2 -right-4 h-2.5 w-1.5 rotate-[-25deg] rounded-sm bg-coral"
        />
      </p>
      {showTagline && (
        <p
          className={`mt-3 text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap ${inverted ? 'text-white/80' : 'text-muted'}`}
        >
          SPEND LESS. LIVE MORE.
        </p>
      )}
    </div>
  );
}
