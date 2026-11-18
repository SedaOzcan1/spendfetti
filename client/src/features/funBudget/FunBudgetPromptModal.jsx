import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMarkAchievementsSeen } from '../../api/achievements.js';
import { Link, useNavigate } from 'react-router-dom';
import { useDecideFunBudget, useFunBudgetPrompt } from '../../api/funBudget.js';
import { useCloseMonth, useSavings } from '../../api/savings.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, SelectInput } from '../../components/ui/Field.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
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

function MoneyInput({ label, value, onChange, hint, error, max }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(a11y) => (
        <div className="flex h-14 items-center rounded-lg border border-line bg-white px-4 focus-within:border-sage">
          <span className="text-xl font-bold text-ink" aria-hidden="true">
            ₺
          </span>
          <input
            {...a11y}
            type="number"
            min="0"
            max={max}
            step="1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent pl-1 text-xl font-bold text-ink tabular-nums focus:outline-none"
          />
        </div>
      )}
    </Field>
  );
}

function PromptBody({ prompt, month, onClose }) {
  const navigate = useNavigate();
  const decide = useDecideFunBudget();
  const close = useCloseMonth();
  const { celebrate } = useConfetti();
  const { data: savings } = useSavings(month);
  const goals = (savings?.goals ?? []).filter((goal) => !goal.achievedAt);

  const [funAmount, setFunAmount] = useState(String(prompt.suggestedAmount));
  const [saveAmount, setSaveAmount] = useState(String(prompt.suggestedSavings));
  const [goalId, setGoalId] = useState('');
  const [neverAsk, setNeverAsk] = useState(false);
  const monthName = formatMonth(month).split(' ')[0];

  const selectedGoal = goalId || goals[0]?.id || '';
  const fun = Number(funAmount) || 0;
  const saved = selectedGoal ? Number(saveAmount) || 0 : 0;
  const leftover = Math.round((prompt.balance - fun - saved) * 100) / 100;
  const error = close.error ?? decide.error;

  const submit = (event) => {
    event.preventDefault();
    close.mutate(
      {
        month,
        funAmount: fun,
        savings: saved > 0 ? [{ goalId: selectedGoal, amount: saved }] : [],
      },
      {
        onSuccess: ({ goalsReached }) => {
          celebrate({
            preset: goalsReached.length ? 'rain' : 'cannons',
            message: goalsReached.length
              ? 'Goal reached! What a way to close the month.'
              : 'Set aside. Your future self says thanks!',
          });
          onClose();
          navigate(fun > 0 ? '/activities' : '/savings');
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
    <form onSubmit={submit} className="text-center">
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
      <p className="mt-3 text-muted">How about sharing it between fun and your future?</p>

      <div className="mt-8 space-y-4 text-left">
        <div className="rounded-2xl bg-mint/70 p-5">
          <MoneyInput
            label="Fun & activities budget"
            value={funAmount}
            onChange={setFunAmount}
            max={prompt.balance}
            hint={`Suggested: ${formatPercent(prompt.ratio)} of your balance`}
          />
        </div>

        <div className="rounded-2xl bg-lavender-light/70 p-5">
          {goals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
              <MoneyInput
                label="Savings & investments"
                value={saveAmount}
                onChange={setSaveAmount}
                max={prompt.balance}
                hint={`Suggested: ${formatPercent(prompt.savingsRatio)}`}
              />
              <SelectInput
                label="Into goal"
                value={selectedGoal}
                onChange={(e) => setGoalId(e.target.value)}
              >
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </SelectInput>
            </div>
          ) : (
            <p className="text-sm text-ink/80">
              <span className="font-medium text-ink">Savings & investments</span> — create a goal to
              send part of your surplus there.{' '}
              <Link to="/savings" onClick={onClose} className="font-semibold text-sage underline">
                Create a goal
              </Link>
            </p>
          )}
        </div>

        <p
          className={`px-1 text-sm ${leftover < 0 ? 'font-medium text-coral' : 'text-muted'}`}
          aria-live="polite"
        >
          {leftover < 0
            ? `That’s ${formatMoney(-leftover, { decimals: 0 })} more than you saved.`
            : `${formatMoney(leftover, { decimals: 0 })} stays in your account.`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {error.message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={close.isPending}
          disabled={leftover < 0 || fun + saved <= 0}
        >
          {fun > 0 ? 'Set it aside and explore activities' : 'Save it'}
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
