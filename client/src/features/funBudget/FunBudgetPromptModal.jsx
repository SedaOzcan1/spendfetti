import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMarkAchievementsSeen } from '../../api/achievements.js';
import { Link, useNavigate } from 'react-router-dom';
import { useDecideFunBudget, useFunBudgetPrompt } from '../../api/funBudget.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';
import { formatMoney, formatPercent } from '../../lib/format.js';
import { formatMonth } from '../../lib/month.js';
import { useConfetti } from '../celebrations/CelebrationProvider.jsx';

function ConfettiDecor() {
  const pieces = [
    ['8%', '22%', '#d95138', -20],
    ['22%', '6%', '#d9ad78', 15],
    ['16%', '62%', '#a6a2c0', 30],
    ['74%', '4%', '#d95138', -25],
    ['82%', '36%', '#526a4b', -35],
    ['88%', '78%', '#d9ad78', 20],
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-36">
      {pieces.map(([left, top, color, rotate]) => (
        <span
          key={`${left}${top}`}
          className="absolute h-4 w-1.5 rounded-sm"
          style={{ left, top, backgroundColor: color, transform: `rotate(${rotate}deg)` }}
        />
      ))}
    </div>
  );
}

const REASON_COPY = {
  already_decided: 'You’ve already made your fun budget decision for this month.',
  disabled: 'End-of-month fun budget suggestions are turned off.',
  no_surplus: 'This month didn’t end with a surplus, so there’s nothing to set aside. Next month!',
};

function PromptBody({ prompt, month, onClose }) {
  const navigate = useNavigate();
  const decide = useDecideFunBudget();
  const { celebrate } = useConfetti();
  const [amount, setAmount] = useState(String(prompt.suggestedAmount));
  const [neverAsk, setNeverAsk] = useState(false);
  const fieldErrors = decide.error instanceof ApiError ? decide.error.fieldErrors : {};
  const monthName = formatMonth(month).split(' ')[0];

  const allocate = (event) => {
    event.preventDefault();
    decide.mutate(
      { month, amount: Number(amount) },
      {
        onSuccess: () => {
          celebrate({ preset: 'cannons', message: 'Fun budget set aside. Enjoy!' });
          onClose();
          navigate('/activities');
        },
      },
    );
  };

  const dismiss = () =>
    decide.mutate(
      { month, dismissed: true, neverAsk: neverAsk || undefined },
      { onSuccess: onClose },
    );

  return (
    <form onSubmit={allocate} className="text-center">
      <ConfettiDecor />
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-mint text-sage">
        <Check className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-sage uppercase">
        You closed {monthName} in style
      </p>
      <h2 id="fun-budget-title" className="mt-3 text-3xl font-bold tracking-tight text-ink">
        You saved {formatMoney(prompt.balance, { decimals: 0 })} this month!
      </h2>
      <p className="mt-3 text-muted">How about turning some of it into new memories?</p>

      <div className="mt-8 rounded-2xl bg-mint/70 p-5 text-left">
        <Field
          label="Fun & activities budget"
          error={fieldErrors.amount}
          hint={`${formatPercent(prompt.ratio)} of your balance · You can change the amount.`}
        >
          {(a11y) => (
            <div className="flex h-16 items-center rounded-lg border border-line bg-white px-5 focus-within:border-sage">
              <span className="text-2xl font-bold text-ink" aria-hidden="true">
                ₺
              </span>
              <input
                {...a11y}
                type="number"
                min="1"
                max={prompt.balance}
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent pl-1 text-2xl font-bold text-ink tabular-nums focus:outline-none"
              />
            </div>
          )}
        </Field>
      </div>

      {decide.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="mt-4 rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {decide.error.message}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <Button type="submit" size="lg" className="w-full" isLoading={decide.isPending}>
          Yes, set it aside and explore activities
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={dismiss}>
          Not now
        </Button>
      </div>
      <label className="mt-6 flex items-center gap-3 text-left text-sm text-muted">
        <input
          type="checkbox"
          checked={neverAsk}
          onChange={(e) => setNeverAsk(e.target.checked)}
          className="size-5 rounded border-line accent-sage"
        />
        Don’t ask me again
      </label>
    </form>
  );
}

export function FunBudgetPromptModal({ open, month, onClose }) {
  const prompt = useFunBudgetPrompt(month, { enabled: open });
  const { celebrate } = useConfetti();
  const markSeen = useMarkAchievementsSeen();
  const celebratedRef = useRef(false);
  const shouldCelebrate = open && prompt.data?.show;
  const balance = prompt.data?.balance;

  // Big burst as the popup opens; the dashboard won't repeat it.
  useEffect(() => {
    if (!open) celebratedRef.current = false;
    if (!shouldCelebrate || celebratedRef.current) return;
    celebratedRef.current = true;
    celebrate({
      preset: 'burst',
      message: `You saved ${formatMoney(balance, { decimals: 0 })} this month!`,
    });
    markSeen.mutate({ month, keys: ['month_positive'] });
  }, [open, shouldCelebrate, balance, month, celebrate, markSeen]);

  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-lg" ariaLabel="Close the month">
      {prompt.isPending && (
        <p role="status" className="py-10 text-center text-muted">
          Closing the month…
        </p>
      )}
      {prompt.isError && (
        <p role="alert" className="py-10 text-center text-coral">
          {prompt.error.message}
        </p>
      )}
      {prompt.data?.show && <PromptBody prompt={prompt.data} month={month} onClose={onClose} />}
      {prompt.data && !prompt.data.show && (
        <div className="py-6 text-center">
          <h2 className="text-2xl font-semibold text-ink">Month closed</h2>
          <p className="mx-auto mt-3 max-w-sm text-muted">{REASON_COPY[prompt.data.reason]}</p>
          <div className="mt-8 flex flex-col gap-3">
            {prompt.data.reason === 'disabled' ? (
              <Link
                to="/settings"
                onClick={onClose}
                className="font-semibold text-sage hover:underline"
              >
                Open settings
              </Link>
            ) : (
              <Link
                to="/activities"
                onClick={onClose}
                className="font-semibold text-sage hover:underline"
              >
                Explore activities
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
