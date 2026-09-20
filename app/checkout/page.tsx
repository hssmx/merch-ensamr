'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  UserRound,
} from 'lucide-react';
import { useCart } from '../cart/cart-provider';
import {
  createOrder,
  getSession,
  isSupabaseConfigured,
  type AuthSession,
} from '../../lib/supabase-rest';
import type { StoredOrder } from '../../lib/order-types';
import { downloadOrderReceipt } from '../receipt-pdf';
import { CommerceSteps } from '../commerce-steps';

type CheckoutDraft = {
  customerName: string;
  email: string;
  phone: string;
  notes: string;
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [session, setSession] = useState<AuthSession | null>(null);
  const signedIn = Boolean(session);
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  function reviewCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || busy) return;

    const data = new FormData(event.currentTarget);
    const nextDraft: CheckoutDraft = {
      customerName: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      notes: String(data.get('notes') || '').trim(),
    };

    setDraft(nextDraft);
    setError('');
    setReviewing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function confirmOrder() {
    if (!draft || !items.length || busy) return;
    setBusy(true);
    setError('');

    try {
      const created = await createOrder({
        customerName: draft.customerName,
        email: draft.email,
        phone: draft.phone,
        fulfillment: 'collection',
        notes: draft.notes,
        items: items.map((item) => ({
          slug: item.slug,
          size: item.size,
          quantity: item.quantity,
        })),
      });
      setOrder(created);
      clear();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not place the order.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return (
      <main id="main" className="commerce-flow-page checkout-success">
        <section className="order-success-card order-success-minimal">
          <div className="order-success-mark">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <span>ORDER RECEIVED</span>
              <strong>{order.order_number}</strong>
            </div>
          </div>

          <h1>Order received.</h1>
          <p>
            We’ll call you to confirm availability, collection at ENSAM Rabat,
            and the payment method. The order is confirmed only after payment.
          </p>

          <div className="order-success-summary">
            <div>
              <span>Total</span>
              <strong>{order.total} MAD</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>Awaiting confirmation</strong>
            </div>
          </div>

          <div className="order-success-actions">
            {signedIn ? (
              <Link className="primary" href={`/account/orders/${order.id}`}>
                Track order <ArrowRight size={17} />
              </Link>
            ) : (
              <Link className="primary" href="/account">
                Create account to track <ArrowRight size={17} />
              </Link>
            )}
            <button
              className="secondary"
              type="button"
              onClick={() => downloadOrderReceipt(order)}
            >
              <Download size={16} /> Download receipt
            </button>
            <Link className="order-success-shop-link" href="/collection">
              Continue shopping
            </Link>
          </div>

          {!signedIn && (
            <p className="order-success-guest-note">
              Create the account on this device and this guest order will attach
              automatically.
            </p>
          )}
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
      <CommerceSteps current={1} />

      {!isSupabaseConfigured() && (
        <div className="system-notice error">
          Checkout backend configuration is not available yet.
        </div>
      )}

      {!items.length ? (
        <section className="empty-cart">
          <h2>Your cart is empty.</h2>
          <Link className="primary" href="/collection">
            Return to collection
          </Link>
        </section>
      ) : reviewing && draft ? (
        <section className="checkout-review" aria-labelledby="checkout-review-title">
          <div className="checkout-review-head">
            <div>
              <span>FINAL CHECK</span>
              <h2 id="checkout-review-title">Your order.</h2>
              <p>Check the details below before sending your order to the team.</p>
            </div>
            <button
              type="button"
              className="checkout-review-edit"
              onClick={() => {
                setReviewing(false);
                setError('');
              }}
            >
              Edit details
            </button>
          </div>

          <div className="checkout-review-grid">
            <section className="checkout-review-details">
              <div className="checkout-review-block">
                <span>Contact</span>
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{draft.customerName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{draft.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{draft.phone}</dd>
                  </div>
                </dl>
              </div>

              <div className="checkout-review-block">
                <span>Collection</span>
                <dl>
                  <div>
                    <dt>Location</dt>
                    <dd>ENSAM Rabat</dd>
                  </div>
                  <div>
                    <dt>Notes</dt>
                    <dd>{draft.notes || 'None'}</dd>
                  </div>
                </dl>
              </div>

              <div className="checkout-review-notice">
                <strong>Before you confirm</strong>
                <p>
                  No payment is taken on this website. The team will call you to
                  confirm availability, collection at ENSAM Rabat, and the payment
                  method. The order is only confirmed after payment.
                </p>
              </div>
            </section>

            <aside className="checkout-review-order">
              <span>YOUR ORDER</span>
              <div className="checkout-review-items">
                {items.map((item) => (
                  <div className="checkout-review-item" key={item.key}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.color} · {item.size} · Qty {item.quantity}
                      </small>
                    </div>
                    <b>{item.unitPrice * item.quantity} MAD</b>
                  </div>
                ))}
              </div>

              <div className="checkout-review-total">
                <span>Items subtotal</span>
                <strong>{subtotal} MAD</strong>
              </div>

              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                className="primary checkout-review-confirm"
                disabled={busy || !isSupabaseConfigured()}
                onClick={confirmOrder}
              >
                {busy ? 'Confirming…' : 'Confirm order'} <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="checkout-review-back"
                disabled={busy}
                onClick={() => setReviewing(false)}
              >
                Go back and edit
              </button>
            </aside>
          </div>
        </section>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={reviewCheckout}>
            {signedIn ? (
              <div className="checkout-account-state">
                <UserRound size={18} />
                <div>
                  <strong>Ordering with your account</strong>
                  <span>{session?.user.email}</span>
                </div>
                <Link href="/account">View account</Link>
              </div>
            ) : (
              <div className="account-nudge">
                <UserRound size={20} />
                <div>
                  <strong>Recommended: create an account.</strong>
                  <p>
                    Guest checkout stays available. An account keeps tracking,
                    order history and receipts in one place.
                  </p>
                  <Link href="/account">Create account / sign in</Link>
                </div>
              </div>
            )}

            <fieldset>
              <legend>
                <span className="form-section-number">01 /</span> Contact
                details
              </legend>
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  defaultValue={
                    draft?.customerName ||
                    String(session?.user.user_metadata?.full_name || '')
                  }
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={180}
                  defaultValue={draft?.email || session?.user.email || ''}
                />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  defaultValue={draft?.phone || ''}
                />
              </label>
            </fieldset>

            <fieldset>
              <legend>
                <span className="form-section-number">02 /</span> Collection
              </legend>
              <div className="collection-only-card">
                <strong>Collect at ENSAM Rabat</strong>
                <span>
                  Your collection details and timing are confirmed during the team call.
                </span>
              </div>
              <label>
                Notes <small>Optional</small>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={500}
                  defaultValue={draft?.notes || ''}
                />
              </label>
            </fieldset>

            <div className="payment-callout">
              <strong>What happens next?</strong>
              <p>
                An admin reviews the order, then a team member calls you. They
                will confirm availability and propose cash or bank transfer.
                Payment is necessary before the order can be marked Confirmed.
              </p>
            </div>

            <label className="checkout-legal-consent">
              <input
                name="terms_accepted"
                type="checkbox"
                required
                defaultChecked={Boolean(draft)}
              />
              <span>
                I have read and accept the <Link href="/legal#terms">Terms of sale</Link>,
                {' '}<Link href="/legal#returns">Returns policy</Link> and
                {' '}<Link href="/legal#privacy">Privacy policy</Link>.
              </span>
            </label>

            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="primary checkout-submit"
              disabled={busy || !isSupabaseConfigured()}
            >
              Review order <ArrowRight size={18} />
            </button>
          </form>

          <aside className="checkout-summary">
            <span>YOUR CART</span>
            <div className="commerce-summary-heading">
              The order
              <span>
                {items.length} {items.length === 1 ? 'design' : 'designs'}
              </span>
            </div>
            {items.map((item) => (
              <div className="checkout-line" key={item.key}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.color} · {item.size} · Qty {item.quantity}
                  </small>
                </div>
                <b>{item.unitPrice * item.quantity} MAD</b>
              </div>
            ))}
            <div className="checkout-total">
              <span>Items subtotal</span>
              <strong>{subtotal} MAD</strong>
            </div>
            <p>Collection only at ENSAM Rabat. No delivery fee applies.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
