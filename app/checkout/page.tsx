'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Download, UserRound } from 'lucide-react';
import { useCart } from '../cart/cart-provider';
import { createOrder, getSession, isSupabaseConfigured } from '../../lib/supabase-rest';
import type { StoredOrder } from '../../lib/order-types';
import { downloadOrderReceipt } from '../receipt-pdf';

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [signedIn, setSignedIn] = useState(false);
  const [fulfillment, setFulfillment] = useState<'collection' | 'delivery'>('collection');
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession().then((session) => setSignedIn(Boolean(session)));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || busy) return;
    setBusy(true);
    setError('');

    const data = new FormData(event.currentTarget);
    try {
      const created = await createOrder({
        customerName: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        phone: String(data.get('phone') || ''),
        fulfillment,
        address: String(data.get('address') || ''),
        notes: String(data.get('notes') || ''),
        items: items.map((item) => ({
          slug: item.slug,
          size: item.size,
          quantity: item.quantity,
        })),
      });
      setOrder(created);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order.');
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <main id="main" className="commerce-flow-page checkout-success">
        <section className="order-success-card">
          <CheckCircle2 size={42} />
          <span>ORDER RECEIVED · {order.order_number}</span>
          <h1>We received your order.</h1>
          <p>
            This is not confirmed yet. A member of the MERCH ENSAM-R team will
            call you to confirm availability, delivery or collection, and the
            payment method.
          </p>
          <div className="payment-callout">
            <strong>Payment is required before your order is confirmed.</strong>
            <p>
              The team will propose cash or bank transfer during the confirmation
              call. Your status changes to Confirmed only after payment is received.
            </p>
          </div>
          <dl className="success-totals">
            <div><dt>Items subtotal</dt><dd>{order.subtotal} MAD</dd></div>
            <div><dt>Current total</dt><dd>{order.total} MAD</dd></div>
          </dl>
          <button
            className="secondary"
            type="button"
            onClick={() => downloadOrderReceipt(order)}
          >
            <Download size={17} /> Download receipt
          </button>
          {signedIn ? (
            <Link className="primary" href={`/account/orders/${order.id}`}>
              Track this order <ArrowRight size={18} />
            </Link>
          ) : (
            <div className="account-nudge account-nudge-success">
              <UserRound size={21} />
              <div>
                <strong>Create an account to track this order.</strong>
                <p>
                  Guest checkout is complete, but live tracking is available only
                  from an account. Sign up on this device and this order will be
                  attached automatically.
                </p>
                <Link href="/account">Create account / sign in</Link>
              </div>
            </div>
          )}
          <Link href="/collection">Continue shopping</Link>
        </section>
      </main>
    );
  }

  return (
    <main id="main" className="commerce-flow-page checkout-page">
      <header className="commerce-flow-head">
        <Link href="/cart" className="page-back">
          <ArrowLeft size={16} /> Back to cart
        </Link>
        <span>CHECKOUT · MANUAL CONFIRMATION</span>
        <h1>Place your order.</h1>
        <p>
          No payment is taken on this website. After you submit, expect a call
          from our team to confirm the order and arrange payment.
        </p>
      </header>

      {!isSupabaseConfigured() && (
        <div className="system-notice error">
          Checkout backend configuration is not available yet.
        </div>
      )}

      {!items.length ? (
        <section className="empty-cart">
          <h2>Your cart is empty.</h2>
          <Link className="primary" href="/collection">Return to collection</Link>
        </section>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={submit}>
            {!signedIn && (
              <div className="account-nudge">
                <UserRound size={20} />
                <div>
                  <strong>Recommended: create an account.</strong>
                  <p>
                    You can still order as a guest. An account gives you live
                    status, order history and receipt access.
                  </p>
                  <Link href="/account">Create account / sign in</Link>
                </div>
              </div>
            )}

            <fieldset>
              <legend>Contact details</legend>
              <label>
                Full name
                <input name="name" autoComplete="name" required maxLength={100} />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required maxLength={180} />
              </label>
              <label>
                Phone
                <input name="phone" type="tel" autoComplete="tel" required maxLength={30} />
              </label>
            </fieldset>

            <fieldset>
              <legend>How do you want to receive it?</legend>
              <div className="fulfillment-choice">
                <label className={fulfillment === 'collection' ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="fulfillment"
                    value="collection"
                    checked={fulfillment === 'collection'}
                    onChange={() => setFulfillment('collection')}
                  />
                  <strong>Collection</strong>
                  <span>Details confirmed during the team call.</span>
                </label>
                <label className={fulfillment === 'delivery' ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="fulfillment"
                    value="delivery"
                    checked={fulfillment === 'delivery'}
                    onChange={() => setFulfillment('delivery')}
                  />
                  <strong>Delivery</strong>
                  <span>Delivery fee is confirmed by the team.</span>
                </label>
              </div>
              {fulfillment === 'delivery' && (
                <label>
                  Delivery address
                  <textarea name="address" required rows={3} maxLength={400} />
                </label>
              )}
              <label>
                Notes <small>Optional</small>
                <textarea name="notes" rows={3} maxLength={500} />
              </label>
            </fieldset>

            <div className="payment-callout">
              <strong>What happens next?</strong>
              <p>
                An admin reviews the order, then a team member calls you.
                They will confirm availability and propose cash or bank transfer.
                Payment is necessary before the order can be marked Confirmed.
              </p>
            </div>

            {error && <p className="field-error" role="alert">{error}</p>}
            <button className="primary checkout-submit" disabled={busy || !isSupabaseConfigured()}>
              {busy ? 'Placing order…' : 'Place order'} <ArrowRight size={18} />
            </button>
          </form>

          <aside className="checkout-summary">
            <span>YOUR CART</span>
            {items.map((item) => (
              <div className="checkout-line" key={item.key}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.color} · {item.size} · Qty {item.quantity}</small>
                </div>
                <b>{item.unitPrice * item.quantity} MAD</b>
              </div>
            ))}
            <div className="checkout-total">
              <span>Items subtotal</span>
              <strong>{subtotal} MAD</strong>
            </div>
            <p>Any delivery fee is added only after the team confirms it with you.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
