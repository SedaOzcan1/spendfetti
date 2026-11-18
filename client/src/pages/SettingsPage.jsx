import { Check, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout, useMe, useUpdateMe } from '../api/auth.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Field, SelectInput, TextInput } from '../components/ui/Field.jsx';
import { Toggle } from '../components/ui/Toggle.jsx';
import { ChangePasswordModal } from '../features/auth/ChangePasswordModal.jsx';
import { ApiError } from '../lib/apiClient.js';

const CURRENCIES = [
  { code: 'TRY', label: 'Turkish lira · TRY' },
  { code: 'EUR', label: 'Euro · EUR' },
  { code: 'USD', label: 'US dollar · USD' },
  { code: 'GBP', label: 'British pound · GBP' },
];

function PercentInput({ label, value, onChange, error, min }) {
  return (
    <Field label={label} error={error}>
      {(a11y) => (
        <div className="flex h-12 items-center rounded-lg border border-line bg-white px-4 focus-within:border-sage">
          <input
            {...a11y}
            type="number"
            min={min}
            max="100"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-[15px] text-ink focus:outline-none"
          />
          <span className="text-muted" aria-hidden="true">
            %
          </span>
        </div>
      )}
    </Field>
  );
}

function formatLastLogin(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
    date,
  );
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? `Today, ${time}`
    : `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date)}, ${time}`;
}

function SettingsForm({ user }) {
  const update = useUpdateMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    name: user.name,
    city: user.city ?? '',
    currency: user.currency,
    confettiEnabled: user.confettiEnabled,
    funBudgetPromptEnabled: user.funBudgetPromptEnabled,
    ratioPercent: String(Math.round(user.funBudgetRatio * 100)),
    savingsPercent: String(Math.round((user.savingsRatio ?? 0.5) * 100)),
  });
  const fieldErrors = update.error instanceof ApiError ? update.error.fieldErrors : {};
  const set = (key) => (value) => {
    setNotice('');
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const { ratioPercent, savingsPercent, ...rest } = form;
    update.mutate(
      {
        ...rest,
        funBudgetRatio: Number(ratioPercent) / 100,
        savingsRatio: Number(savingsPercent) / 100,
      },
      { onSuccess: () => setNotice('Changes saved.') },
    );
  };

  const signOut = () =>
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Make Spendfetti your own."
        showMonth={false}
        action={
          <Button
            type="submit"
            form="settings-form"
            size="lg"
            className="hidden sm:inline-flex sm:min-w-52"
            isLoading={update.isPending}
          >
            <Save className="size-5" aria-hidden="true" /> Save
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:mt-10 xl:grid-cols-[2fr_1fr]">
        <form id="settings-form" onSubmit={submit} className="space-y-6">
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">Your profile</h2>
            <p className="mt-1.5 text-sm text-muted">
              Help us get to know you and your preferences.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <TextInput
                label="Full name"
                required
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                error={fieldErrors.name}
              />
              <TextInput label="Email" type="email" value={user.email} readOnly disabled />
              <TextInput
                label="City"
                value={form.city}
                onChange={(e) => set('city')(e.target.value)}
                error={fieldErrors.city}
              />
              <SelectInput
                label="Currency"
                value={form.currency}
                onChange={(e) => set('currency')(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </SelectInput>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">Little celebrations, your call</h2>
            <div className="mt-8 divide-y divide-line">
              <div className="pb-6">
                <Toggle
                  id="confetti"
                  label="Confetti effects"
                  description="Short, subtle celebrations for your wins."
                  checked={form.confettiEnabled}
                  onChange={set('confettiEnabled')}
                />
              </div>
              <div className="pt-6">
                <Toggle
                  id="fun-budget"
                  label="End-of-month fun budget suggestion"
                  description="Set aside part of what’s left for yourself."
                  checked={form.funBudgetPromptEnabled}
                  onChange={set('funBudgetPromptEnabled')}
                />
              </div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <PercentInput
                label="Suggested fun budget"
                value={form.ratioPercent}
                onChange={set('ratioPercent')}
                error={fieldErrors.funBudgetRatio}
                min="1"
              />
              <PercentInput
                label="Suggested savings & investments"
                value={form.savingsPercent}
                onChange={set('savingsPercent')}
                error={fieldErrors.savingsRatio}
                min="0"
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              Shares of a month’s surplus, suggested only in months with a positive balance.
            </p>
          </Card>

          {update.error && !Object.keys(fieldErrors).length && (
            <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
              {update.error.message}
            </p>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" size="lg" className="min-w-60" isLoading={update.isPending}>
              Save changes
            </Button>
            <p role="status" className="flex items-center gap-1.5 text-sm text-sage">
              {notice && (
                <>
                  <Check className="size-4" aria-hidden="true" /> {notice}
                </>
              )}
            </p>
          </div>
        </form>

        <div className="space-y-6">
          <Card tone="mint" className="p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-ink">Your account is safe.</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/80">
              Your finances are private to you.
              <br />
              You can update your password anytime.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-8 w-full border-transparent"
              onClick={() => setPasswordOpen(true)}
            >
              Change password
            </Button>
            <p className="mt-8 text-sm text-ink/70">
              Last sign-in: {formatLastLogin(user.lastLoginAt)}
            </p>
          </Card>

          <Card tone="muted" className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">A calmer experience</h2>
            <p className="mt-4 leading-relaxed text-muted">
              If reduced motion is on for your device, we show a simple success message instead of
              confetti. You’re always in control.
            </p>
          </Card>

          <Button variant="danger" onClick={signOut} isLoading={logout.isPending}>
            Sign out
          </Button>
        </div>
      </div>

      <ChangePasswordModal
        open={passwordOpen}
        onClose={(changed) => {
          setPasswordOpen(false);
          if (changed) setNotice('Password updated.');
        }}
      />
    </>
  );
}

export default function SettingsPage() {
  const { data: user } = useMe();
  return user ? <SettingsForm key={user.id} user={user} /> : null;
}
