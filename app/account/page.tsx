'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  LogOut,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import {
  consumeAuthRedirect,
  getSession,
  isCurrentUserAdmin,
  listMyOrders,
  resendSignupConfirmation,
  signIn,
  signOut,
  signUp,
  type AuthSession,
} from '../../lib/supabase-rest';
import type { StoredOrder } from '../../lib/order-types';
import { statusLabels } from '../../lib/order-types';

export default function AccountPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'error' | 'success'>('error');
  const [pendingEmail, setPendingEmail] = useState('');
  const [allowResend, setAllowResend] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  async function load() {
    setBusy(true);

    const callback = await consumeAuthRedirect();
    if (callback.error) {
      setMessage(callback.error);
      setMessageTone('error');
      setAllowResend(/expired|invalid|confirm/i.test(callback.error));
    }

    const active = callback.session ?? (await getSession());
    setSession(active);

    if (active) {
      const [myOrders, admin] = await Promise.all([
        listMyOrders(),
        isCurrentUserAdmin(),
      ]);
      setOrders(myOrders);
      setIsAdmin(admin);
    } else {
      setOrders([]);
      setIsAdmin(false);
    }

    if (
      active &&
      new URLSearchParams(window.location.search).get('confirmed') === '1'
    ) {
      setMessage('Email confirmed. Your account is ready.');
      setMessageTone('success');
      window.history.replaceState({}, '', '/account');
    }

    setBusy(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '').trim();

    try {
      if (mode === 'signup') {
        const result = await signUp(
          String(data.get('name') || ''),
          email,
          String(data.get('password') || ''),
        );

        if (!result.access_token) {
          setPendingEmail(email);
          setAllowResend(false);
          setMessage(
            'Account created. Check your inbox and confirm your email, then you will return here signed in.',
          );
          setMessageTone('success');
          setMode('signin');
          setBusy(false);
          return;
        }
      } else {
        await signIn(email, String(data.get('password') || ''));
      }
      await load();
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Could not continue.';
      setMessage(text);
      setMessageTone('error');
      if (/confirm|verified|verification/i.test(text) && email) {
        setPendingEmail(email);
        setAllowResend(true);
      }
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!pendingEmail || resendBusy) return;
    setResendBusy(true);
    setMessage('');

    try {
      await resendSignupConfirmation(pendingEmail);
      setMessage('A new confirmation email was sent. Use the newest link only.');
      setMessageTone('success');
      setAllowResend(false);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Could not resend the confirmation email.',
      );
      setMessageTone('error');
    } finally {
      setResendBusy(false);
    }
  }

  async function logout() {
    await signOut();
    setSession(null);
    setOrders([]);
  }

  if (busy && !session) {
    return (
      <main
        id="main"
        className="commerce-flow-page account-page account-loading"
      >
        <div className="account-loading-mark">
          <span />
          <p>Loading your account…</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main id="main" className="commerce-flow-page account-page">
        <div className="account-auth-layout">
          <aside className="account-auth-intro">
            <span className="commerce-kicker">ACCOUNT · ORDER TRACKING</span>
            <h1>Keep every order in one place.</h1>
            <p>
              Guest checkout stays available. An account gives you the complete
              history, live status and downloadable receipts after every order.
            </p>

            <div className="account-benefits">
              <div>
                <Clock3 size={19} />
                <span>
                  <strong>Track progress</strong>
                  See confirmation, payment and fulfilment updates.
                </span>
              </div>
              <div>
                <Download size={19} />
                <span>
                  <strong>Keep receipts</strong>
                  Download order receipts whenever you need them.
                </span>
              </div>
              <div>
                <ShieldCheck size={19} />
                <span>
                  <strong>Guest orders follow you</strong>
                  Orders from this browser are attached automatically after
                  sign-in.
                </span>
              </div>
            </div>

            <Link href="/collection" className="account-back-shop">
              Shop the collection <ArrowRight size={17} />
            </Link>
          </aside>

          <section className="account-auth-card">
            <div className="account-auth-card-head">
              <span className="account-auth-icon">
                <UserRound size={19} />
              </span>
              <div>
                <small>
                  {mode === 'signin' ? 'WELCOME BACK' : 'NEW ACCOUNT'}
                </small>
                <h2>{mode === 'signin' ? 'Sign in.' : 'Create account.'}</h2>
              </div>
            </div>

            <p className="account-auth-copy">
              {mode === 'signin'
                ? 'Use the email and password connected to your MERCH ENSAM-R account.'
                : 'Create an account now, or continue shopping as a guest and create one later.'}
            </p>

            {message && (
              <div
                className={`account-message ${messageTone}`}
                role={messageTone === 'error' ? 'alert' : 'status'}
              >
                {messageTone === 'success' ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <UserRound size={17} />
                )}
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={submit}>
              {mode === 'signup' && (
                <label>
                  <span>Full name</span>
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    maxLength={100}
                  />
                </label>
              )}
              <label>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={pendingEmail}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                />
                {mode === 'signup' && <small>At least 8 characters.</small>}
              </label>

              {mode === 'signin' && (
                <Link className="account-forgot-link" href="/account/forgot-password">
                  Forgot password?
                </Link>
              )}

              <button className="primary account-submit" disabled={busy}>
                <span>
                  {busy
                    ? 'Working…'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Create account'}
                </span>
                <ArrowRight size={17} />
              </button>

              {mode === 'signup' && (
                <p className="account-auth-privacy">
                  By creating an account, you acknowledge the{' '}
                  <Link href="/legal#privacy">Privacy policy</Link> and{' '}
                  <Link href="/legal#terms">Terms of sale</Link>.
                </p>
              )}
            </form>

            {allowResend && pendingEmail && (
              <button
                type="button"
                className="account-resend"
                disabled={resendBusy}
                onClick={resendConfirmation}
              >
                {resendBusy ? 'Sending…' : 'Send a new confirmation link'}
              </button>
            )}

            <div className="account-auth-switch">
              <span>
                {mode === 'signin' ? 'No account yet?' : 'Already registered?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setMessage('');
                }}
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="commerce-flow-page account-page">
      <header className="account-dashboard-head">
        <div>
          <span className="commerce-kicker">YOUR ACCOUNT</span>
          <h1>Your orders.</h1>
          <p>{session.user.email}</p>
        </div>
        <div className="account-head-actions">
          <Link className="secondary" href="/account/settings">Account settings</Link>
          {isAdmin && (
            <Link className="secondary" href="/admin">
              <ShieldCheck size={16} /> Admin dashboard
            </Link>
          )}
          <button type="button" className="secondary" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <div className="account-dashboard-intro">
        <div>
          <span>YOUR ORDER HISTORY</span>
          <strong>{String(orders.length).padStart(2, '0')}</strong>
        </div>
        <p>
          Every order, update and receipt in one place. Open an order to see
          where it stands.
        </p>
      </div>

      {!orders.length ? (
        <section className="empty-cart account-empty">
          <PackageCheck size={34} />
          <h2>No orders yet.</h2>
          <p>
            Your future orders, tracking updates and receipts will appear here.
          </p>
          <Link className="primary" href="/collection">
            Shop collection <ArrowRight size={17} />
          </Link>
        </section>
      ) : (
        <section className="account-orders">
          {orders.map((order) => (
            <article key={order.id} className="account-order-card">
              <div>
                <small>
                  ORDER {order.order_number} ·{' '}
                  {new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </small>
                <h2>{statusLabels[order.status]}</h2>
                <p>{order.items.map((item) => item.name).join(' · ')}</p>
              </div>
              <div className="account-order-meta">
                <span>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                  {order.items.reduce((sum, item) => sum + item.quantity, 0) ===
                  1
                    ? 'piece'
                    : 'pieces'}
                </span>
                <strong>{order.total} MAD</strong>
              </div>
              <Link href={`/account/orders/${order.id}`}>
                View details & tracking <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
