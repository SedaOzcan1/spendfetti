import { useState } from 'react';
import { useChangePassword } from '../../api/auth.js';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ApiError } from '../../lib/apiClient.js';
import { PasswordInput } from './PasswordInput.jsx';

function ChangePasswordForm({ onDone }) {
  const changePassword = useChangePassword();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const fieldErrors =
    changePassword.error instanceof ApiError ? changePassword.error.fieldErrors : {};

  const submit = (event) => {
    event.preventDefault();
    changePassword.mutate(form, { onSuccess: () => onDone(true) });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        required
        value={form.currentPassword}
        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        error={fieldErrors.currentPassword}
      />
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
        value={form.newPassword}
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        error={fieldErrors.newPassword}
        hint="At least 8 characters, with a letter and a number."
      />
      {changePassword.error && !Object.keys(fieldErrors).length && (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-sm text-coral">
          {changePassword.error.message}
        </p>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={() => onDone(false)}>
          Cancel
        </Button>
        <Button type="submit" size="lg" isLoading={changePassword.isPending}>
          Update password
        </Button>
      </div>
    </form>
  );
}

export function ChangePasswordModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={() => onClose(false)} title="Change password">
      {open && <ChangePasswordForm onDone={onClose} />}
    </Modal>
  );
}
