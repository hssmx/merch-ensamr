'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { getMyOrder } from '../../../../lib/supabase-rest';
import {
  statusDescriptions,
  statusLabels,
  type StoredOrder,
} from '../../../../lib/order-types';
import { downloadOrderReceipt } from '../../../receipt-pdf';

const stages = [
  'pending_confirmation',
  'awaiting_payment',
  'confirmed',
  'preparing',
  'ready',
  'completed',
];

export default function AccountOrderPage() {
  const params = useParams();
  const id = String(params.id || '');
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    void getMyOrder(id)
      .then((value) => {
        if (active) setOrder(value);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main id="main" className="commerce-flow-page">
        <p>Loading order…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main id="main" className="commerce-flow-page">
        <section className="empty-cart">
          <h1>Order not found.</h1>
          <p>
            {loadError
              ? 'We could not load this order. Please try again in a moment.'
              : 'Sign in with the account that owns this order.'}
          </p>
          <Link className="primary" href="/account">
            Back to account
          </Link>
        </section>
      </main>
    );
  }

  const currentIndex = stages.indexOf(order.status);
  const progress =
    currentIndex < 0 ? 0 : (currentIndex / (stages.length - 1)) * 100;
  const currentStep = currentIndex < 0 ? 0 : currentIndex + 1;

  return (
    <main id="main" className="commerce-flow-page order-detail-page">
      <header className="order-detail-head order-detail-head-clean">
        <Link className="page-back" href="/account">
          <ArrowLeft size={16} /> All orders
        </Link>
        <div className="order-detail-heading-copy">
          <span>{order.order_number}</span>
          <h1>Order details.</h1>
          <p>
            Placed{' '}
            {new Date(order.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      <div className="order-detail-layout order-detail-layout-clean">
        <section className="order-status-card">
          <div className="order-status-card-head">
            <div>
              <span>Current status</span>
              <h2>{statusLabels[order.status]}</h2>
            </div>
            {order.status !== 'cancelled' && (
              <small>
                Step {currentStep} of {stages.length}
              </small>
            )}
          </div>

          {order.status === 'cancelled' ? (
            <div className="order-status-cancelled">
              <strong>Order cancelled</strong>
              <p>This order will not continue through fulfilment.</p>
            </div>
          ) : (
            <>
              <div className="order-progress" aria-label="Order progress">
                <div className="order-progress-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
                <div className="order-progress-dots" aria-hidden="true">
                  {stages.map((stage, index) => (
                    <i
                      key={stage}
                      className={
                        index < currentIndex
                          ? 'done'
                          : index === currentIndex
                            ? 'current'
                            : ''
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="order-current-copy">
                <p>{statusDescriptions[order.status]}</p>
              </div>
            </>
          )}

          {order.admin_note && (
            <div className="order-team-update">
              <span>Team update</span>
              <p>{order.admin_note}</p>
            </div>
          )}

          <div className="order-next-step">
            <span>What happens next</span>
            <p>
              We’ll call to confirm the order and payment method. Payment must be
              received before the order is marked confirmed.
            </p>
          </div>
        </section>

        <aside className="order-receipt-card order-receipt-card-clean">
          <div className="order-receipt-card-head">
            <div>
              <span>YOUR ORDER</span>
              <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</strong>
            </div>
            <strong>{order.total} MAD</strong>
          </div>

          <div className="order-receipt-items">
            {order.items.map((item) => (
              <div className="checkout-line" key={`${item.slug}:${item.size}`}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.color} · {item.size} · Qty {item.quantity}
                  </small>
                </div>
                <b>{item.lineTotal} MAD</b>
              </div>
            ))}
          </div>

          <dl>
            <div>
              <dt>Collection</dt>
              <dd>ENSAM Rabat</dd>
            </div>
            {order.notes && (
              <div>
                <dt>Your note</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
            <div>
              <dt>Subtotal</dt>
              <dd>{order.subtotal} MAD</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</dd>
            </div>
            {order.payment_method && (
              <div>
                <dt>Method</dt>
                <dd>
                  {order.payment_method === 'cash' ? 'Cash' : 'Bank transfer'}
                </dd>
              </div>
            )}
          </dl>

          <button
            className="secondary"
            onClick={() => downloadOrderReceipt(order)}
          >
            <Download size={17} /> Download receipt
          </button>
        </aside>
      </div>
    </main>
  );
}
