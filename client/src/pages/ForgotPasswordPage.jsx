import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { TextInput } from '../components/ui/Field.jsx';
import { AuthLayout } from '../features/auth/AuthLayout.jsx';
import { apiRequest } from '../lib/apiClient.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const request = useMutation({
    mutationFn: () => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  });

  const submit = (event) => {
    event.preventDefault();
    request.mutate();
  };

  return (
    <AuthLayout prompt="Remembered it?" linkLabel="Sign in" linkTo="/login">
      {request.isSuccess ? (
        <div role="status">
          <span className="grid size-14 place-items-center rounded-full bg-mint text-sage">
            <MailCheck className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-ink">Check your inbox.</h2>
          <p className="mt-3 text-muted">
            If an account exists for <strong className="text-ink">{email}</strong>, we’ve sent a
            link to reset your password. It’s valid for 30 minutes.
          </p>
          {import.meta.env.DEV && (
            <p className="mt-6 rounded-lg bg-subtle px-4 py-3 text-sm text-muted">
              Development: without SMTP configured, the link is printed in the API console.
            </p>
          )}
          <Link to="/login" className="mt-8 inline-block font-semibold text-sage hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h2 className="text-4xl font-bold tracking-tight text-ink">Forgot your password?</h2>
          <p className="mt-3 text-muted">
            No worries. Enter your email and we’ll send you a reset link.
          </p>
          <form onSubmit={submit} className="mt-10 space-y-6">
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {request.error && (
              <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
                {request.error.message}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" isLoading={request.isPending}>
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
