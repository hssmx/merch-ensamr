'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { requestPasswordReset } from '../../../lib/supabase-rest';

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      await requestPasswordReset(String(data.get('email') || ''));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="commerce-flow-page account-page">
      <section className="account-utility-card">
        <Link href="/account" className="page-back"><ArrowLeft size={16} /> Back to sign in</Link>
        <span className="commerce-kicker">ACCOUNT SECURITY</span>
        <h1>Reset your password.</h1>
        {sent ? (
          <div className="account-message success" role="status">
            <Mail size={17} />
            <span>If an account exists for that email, a password-reset link has been sent. Use the newest email only.</span>
          </div>
        ) : (
          <>
            <p>Enter the email connected to your account. The reset link returns to this store so you can choose a new password.</p>
            <form onSubmit={submit}>
              <label>
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
              {error && <p className="field-error" role="alert">{error}</p>}
              <button className="primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
