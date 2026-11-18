import { Link } from 'react-router-dom';
import { Logo } from '../../components/layout/Logo.jsx';

export function AuthLayout({ prompt, linkLabel, linkTo, children }) {
  return (
    <div className="grid min-h-screen bg-page lg:grid-cols-2">
      <aside className="hidden flex-col bg-forest px-14 py-14 text-white lg:flex xl:px-16">
        <Logo inverted />
        <h1 className="mt-auto text-5xl leading-[1.1] font-semibold tracking-tight xl:text-6xl">
          Plan your money.
          <br />
          Make room for life.
        </h1>
        <p className="mt-10 max-w-md text-lg leading-relaxed text-white/80">
          Track your spending, protect your budget.
          <br />
          Enjoy what’s left, guilt-free.
        </p>
        <div className="mt-20 max-w-xl rounded-3xl bg-mint p-8 text-ink">
          <p className="text-xs font-semibold tracking-[0.12em] text-forest/80">
            GOOD MOMENTS ADD UP
          </p>
          <p className="mt-6 text-5xl font-bold tracking-tight">₺16,500</p>
          <p className="mt-3 font-medium text-sage">Left in your pocket this month</p>
          <p className="mt-6 text-sm text-muted">One step closer to your next good plan.</p>
        </div>
        <p className="mt-auto pt-12 text-sm text-white/70">Small steps. Big plans.</p>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="lg:hidden">
            <Logo showTagline={false} />
          </span>
          <p className="ml-auto text-muted">
            <span className="hidden sm:inline">{prompt} </span>
            <Link to={linkTo} className="ml-2 font-semibold text-coral hover:underline">
              {linkLabel}
            </Link>
          </p>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-12">{children}</div>
      </main>
    </div>
  );
}
