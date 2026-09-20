'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Trash2 } from 'lucide-react';
import {
  getMyDeletionRequests,
  getSession,
  requestAccountDeletion,
  type AccountDeletionRequest,
  type AuthSession,
} from '../../../lib/supabase-rest';

export default function AccountSettingsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setBusy(true);
    const active = await getSession();
    setSession(active);
    setRequests(active ? await getMyDeletionRequests() : []);
    setBusy(false);
  }

  useEffect(() => { load(); }, []);

  async function requestDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    try {
      await requestAccountDeletion(String(data.get('reason') || ''));
      setMessage('Deletion request submitted. An admin will review it.');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not submit request.');
      setBusy(false);
    }
  }

  if (busy && !session) {
    return <main id="main" className="commerce-flow-page"><p>Loading account settings…</p></main>;
  }

  if (!session) {
    return (
      <main id="main" className="commerce-flow-page">
        <section className="empty-cart">
          <h1>Sign in required.</h1>
          <Link className="primary" href="/account">Sign in</Link>
        </section>
      </main>
    );
  }

  const openRequest = requests.find((item) => item.status === 'pending' || item.status === 'in_review');

  return (
    <main id="main" className="commerce-flow-page account-page">
      <header className="commerce-flow-head">
        <Link href="/account" className="page-back"><ArrowLeft size={16} /> Account</Link>
        <span>ACCOUNT · PRIVACY & SECURITY</span>
        <h1>Account settings.</h1>
        <p>{session.user.email}</p>
      </header>

      <section className="account-settings-grid">
        <article>
          <KeyRound size={20} />
          <h2>Password</h2>
          <p>Send a secure reset link to your email if you want to change your password.</p>
          <Link className="secondary" href="/account/forgot-password">Reset password</Link>
        </article>

        <article className="danger-zone">
          <Trash2 size={20} />
          <h2>Delete account</h2>
          {openRequest ? (
            <>
              <p>Your deletion request is <strong>{openRequest.status.replace('_', ' ')}</strong>. We may retain transaction records where required for accounting, fraud prevention, disputes or legal obligations.</p>
              <small>Requested {new Date(openRequest.created_at).toLocaleDateString('en-GB')}</small>
            </>
          ) : (
            <>
              <p>Request deletion of your sign-in account and profile data. Order records may need to be retained where the law requires it.</p>
              <form onSubmit={requestDeletion}>
                <label>
                  <span>Reason <small>Optional</small></span>
                  <textarea name="reason" rows={3} maxLength={500} />
                </label>
                <button className="secondary danger-action" disabled={busy} type="submit">
                  Request account deletion
                </button>
              </form>
            </>
          )}
          {message && <p className="account-settings-message">{message}</p>}
        </article>
      </section>
    </main>
  );
}
