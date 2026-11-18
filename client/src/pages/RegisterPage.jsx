import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../api/auth.js';
import { Button } from '../components/ui/Button.jsx';
import { TextInput } from '../components/ui/Field.jsx';
import { AuthLayout } from '../features/auth/AuthLayout.jsx';
import { PasswordInput } from '../features/auth/PasswordInput.jsx';
import { ApiError } from '../lib/apiClient.js';

export default function RegisterPage() {
  const register = useRegister();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', city: '', password: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const fieldErrors = register.error instanceof ApiError ? register.error.fieldErrors : {};
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = (event) => {
    event.preventDefault();
    register.mutate(
      { ...form, city: form.city || undefined },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  };

  return (
    <AuthLayout prompt="Already have an account?" linkLabel="Sign in" linkTo="/login">
      <h2 className="text-4xl font-bold tracking-tight text-ink">A good start.</h2>
      <p className="mt-3 text-muted">Begin a better relationship with your money.</p>

      <form onSubmit={submit} className="mt-10 space-y-5">
        <TextInput
          label="Full name"
          autoComplete="name"
          required
          value={form.name}
          onChange={set('name')}
          error={fieldErrors.name}
        />
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
        />
        <TextInput
          label="City"
          autoComplete="address-level2"
          value={form.city}
          onChange={set('city')}
          error={fieldErrors.city}
          hint="Used to suggest activities near you."
        />
        <PasswordInput
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          hint="At least 8 characters, with a letter and a number."
        />
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 size-5 rounded border-line accent-sage"
          />
          <span>
            I accept the{' '}
            <Link to="/terms" target="_blank" className="font-medium text-sage underline">
              terms of use
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" className="font-medium text-sage underline">
              privacy policy
            </Link>
            .
          </span>
        </label>

        {register.error && !Object.keys(fieldErrors).length && (
          <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
            {register.error.message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={register.isPending}
          disabled={!acceptedTerms}
        >
          Create my account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted">
        Start for free. Keep going in small steps.
      </p>
    </AuthLayout>
  );
}
