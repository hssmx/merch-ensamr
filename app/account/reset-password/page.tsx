'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import {
  consumePasswordRecoveryRedirect,
  updatePassword,
} from '../../../lib/supabase-rest';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    consumePasswordRecoveryRedirect().then(({ session, error }) => {
      setReady(Boolean(session));
      setError(error || '');
      setBusy(false);
    });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    const confirm = String(data.get('confirm') || '');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      setBusy(false);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      setBusy(false);
      return;
    }
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="commerce-flow-page account-page">
      <section className="account-utility-card">
        <span className="commerce-kicker">ACCOUNT SECURITY</span>
        <h1>Choose a new password.</h1>
        {busy && !ready && !error ? (
          <p>Checking your reset link…</p>
        ) : done ? (
          <>
            <div className="account-message success" role="status">
              <CheckCircle2 size={17} />
              <span>Password updated successfully.</span>
            </div>
            <Link className="primary" href="/account">Open my account</Link>
          </>
        ) : ready ? (
          <form onSubmit={submit}>
            <label>
              <span>New password</span>
              <input name="password" type="password" minLength={8} required autoComplete="new-password" />
            </label>
            <label>
              <span>Confirm password</span>
              <input name="confirm" type="password" minLength={8} required autoComplete="new-password" />
            </label>
            {error && <p className="field-error" role="alert">{error}</p>}
            <button className="primary" disabled={busy}><KeyRound size={16} /> Update password</button>
          </form>
        ) : (
          <>
            <p className="field-error">{error || 'This reset link is invalid or expired.'}</p>
            <Link className="primary" href="/account/forgot-password">Request a new reset link</Link>
          </>
        )}
      </section>
    </main>
  );
}
