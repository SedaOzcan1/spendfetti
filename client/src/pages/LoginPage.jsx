import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../api/auth.js';
import { Button } from '../components/ui/Button.jsx';
import { TextInput } from '../components/ui/Field.jsx';
import { AuthLayout } from '../features/auth/AuthLayout.jsx';
import { PasswordInput } from '../features/auth/PasswordInput.jsx';

export default function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });

  const submit = (event) => {
    event.preventDefault();
    login.mutate(form, {
      onSuccess: () => navigate(location.state?.from?.pathname ?? '/', { replace: true }),
    });
  };

  return (
    <AuthLayout prompt="Don’t have an account?" linkLabel="Create account" linkTo="/register">
      <h2 className="text-4xl font-bold tracking-tight text-ink">Welcome back.</h2>
      <p className="mt-3 text-muted">Pick up your plans where you left off.</p>

      <form onSubmit={submit} className="mt-10 space-y-6">
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <PasswordInput
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <label className="flex items-center gap-3 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            className="size-5 rounded border-line accent-sage"
          />
          Remember me
        </label>

        {login.error && (
          <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
            {login.error.message}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" isLoading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Track your spending. Celebrate what’s left.
      </p>
    </AuthLayout>
  );
}
