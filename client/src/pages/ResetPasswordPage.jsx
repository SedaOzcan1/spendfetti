import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { meQueryKey } from '../api/auth.js';
import { Button } from '../components/ui/Button.jsx';
import { AuthLayout } from '../features/auth/AuthLayout.jsx';
import { PasswordInput } from '../features/auth/PasswordInput.jsx';
import { ApiError, apiRequest } from '../lib/apiClient.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;

  const reset = useMutation({
    mutationFn: () =>
      apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { token, password: form.password },
      }),
    // The reset signs out every session, including this browser's
    onSuccess: () => queryClient.setQueryData(meQueryKey, null),
  });
  const fieldErrors = reset.error instanceof ApiError ? reset.error.fieldErrors : {};

  const submit = (event) => {
    event.preventDefault();
    if (!mismatch) reset.mutate();
  };

  if (!token) {
    return (
      <AuthLayout prompt="Remembered it?" linkLabel="Sign in" linkTo="/login">
        <h2 className="text-4xl font-bold tracking-tight text-ink">Link missing.</h2>
        <p className="mt-3 text-muted">This page needs the link from your reset email.</p>
        <Link
          to="/forgot-password"
          className="mt-8 inline-block font-semibold text-sage hover:underline"
        >
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout prompt="Remembered it?" linkLabel="Sign in" linkTo="/login">
      {reset.isSuccess ? (
        <div role="status">
          <span className="grid size-14 place-items-center rounded-full bg-mint text-sage">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-ink">Password updated.</h2>
          <p className="mt-3 text-muted">
            For your security, you’ve been signed out everywhere. Sign in with your new password.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-coral px-6 font-semibold text-white hover:bg-coral-dark"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-4xl font-bold tracking-tight text-ink">Choose a new password.</h2>
          <p className="mt-3 text-muted">Make it one you haven’t used here before.</p>
          <form onSubmit={submit} className="mt-10 space-y-6">
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={fieldErrors.password}
              hint="At least 8 characters, with a letter and a number."
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              error={mismatch ? 'Passwords don’t match' : undefined}
            />
            {reset.error && !Object.keys(fieldErrors).length && (
              <div role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
                {reset.error.message}.{' '}
                <Link to="/forgot-password" className="font-semibold underline">
                  Request a new link
                </Link>
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={reset.isPending}
              disabled={mismatch}
            >
              Update password
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
