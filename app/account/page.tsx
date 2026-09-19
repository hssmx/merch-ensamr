'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LogOut, PackageCheck, UserRound } from 'lucide-react';
import {
  getSession,
  listMyOrders,
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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setBusy(true);
    const active = await getSession();
    setSession(active);
    setOrders(active ? await listMyOrders() : []);
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
    try {
      if (mode === 'signup') {
        const result = await signUp(
          String(data.get('name') || ''),
          String(data.get('email') || ''),
          String(data.get('password') || ''),
        );
        if (!result.access_token) {
          setMessage('Account created. Check your email to verify it, then sign in here.');
          setMode('signin');
          setBusy(false);
          return;
        }
      } else {
        await signIn(
          String(data.get('email') || ''),
          String(data.get('password') || ''),
        );
      }
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not continue.');
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    setSession(null);
    setOrders([]);
  }

  if (busy && !session) {
    return <main id="main" className="commerce-flow-page account-page"><p>Loading…</p></main>;
  }

  if (!session) {
    return (
      <main id="main" className="commerce-flow-page account-page">
        <section className="account-auth-card">
          <UserRound size={28} />
          <span>YOUR MERCH ACCOUNT</span>
          <h1>{mode === 'signin' ? 'Track your orders.' : 'Create your account.'}</h1>
          <p>
            Accounts are recommended because they keep your order details,
            tracking updates and downloadable receipts in one place.
          </p>
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Full name
                <input name="name" required autoComplete="name" maxLength={100} />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>
            {message && <p className="field-error">{message}</p>}
            <button className="primary" disabled={busy}>
              {mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={17} />
            </button>
          </form>
          <button
            className="account-mode-switch"
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setMessage('');
            }}
          >
            {mode === 'signin'
              ? 'New here? Create an account'
              : 'Already have an account? Sign in'}
          </button>
          <p className="account-claim-note">
            If you already placed a guest order in this browser, it is attached
            automatically after you sign in.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main id="main" className="commerce-flow-page account-page">
      <header className="account-dashboard-head">
        <div>
          <span>YOUR ACCOUNT</span>
          <h1>Orders & tracking.</h1>
          <p>{session.user.email}</p>
        </div>
        <button type="button" className="secondary" onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </header>

      {!orders.length ? (
        <section className="empty-cart">
          <PackageCheck size={34} />
          <h2>No orders yet.</h2>
          <Link className="primary" href="/collection">Shop collection</Link>
        </section>
      ) : (
        <section className="account-orders">
          {orders.map((order) => (
            <article key={order.id} className="account-order-card">
              <div>
                <small>{order.order_number}</small>
                <h2>{statusLabels[order.status]}</h2>
                <p>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="account-order-meta">
                <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
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
