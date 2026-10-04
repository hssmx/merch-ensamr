'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bell, CheckCircle2, Download } from 'lucide-react';
import { getMyOrder, listOrderActivity } from '../../../../lib/supabase-rest';
import {
  statusDescriptions,
  statusLabels,
  type OrderActivity,
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
  const [activity, setActivity] = useState<OrderActivity[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([getMyOrder(id), listOrderActivity(id)])
      .then(([value, history]) => {
        if (active) {
          setOrder(value);
          setActivity(history);
        }
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

  return (
    <main id="main" className="commerce-flow-page order-detail-page">
      <header className="order-detail-head">
        <Link className="page-back" href="/account">
          <ArrowLeft size={16} /> All orders
        </Link>
        <span>{order.order_number}</span>
        <h1>{statusLabels[order.status]}</h1>
        <p>{statusDescriptions[order.status]}</p>
      </header>
      <div className="order-detail-layout">
        <section className="order-tracking tracking-minimal">
          <div className="tracking-minimal-head">
            <div>
              <span>Current status</span>
              <strong>{statusLabels[order.status]}</strong>
            </div>
            <time dateTime={order.created_at}>
              Placed{' '}
              {new Date(order.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </time>
          </div>

          {order.status === 'cancelled' ? (
            <p className="tracking-cancelled">This order was cancelled.</p>
          ) : (
            <ol className="tracking-minimal-list">
              {stages.map((stage, index) => (
                <li
                  key={stage}
                  className={
                    index < currentIndex
                      ? 'done'
                      : index === currentIndex
                        ? 'current'
                        : ''
                  }
                >
                  <i aria-hidden="true" />
                  <div>
                    <strong>
                      {statusLabels[stage as keyof typeof statusLabels]}
                    </strong>
                    {index === currentIndex && (
                      <p>
                        {
                          statusDescriptions[
                            stage as keyof typeof statusDescriptions
                          ]
                        }
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {order.admin_note && (
            <div className="tracking-team-note">
              <span>Team update</span>
              <p>{order.admin_note}</p>
            </div>
          )}

          <div className="tracking-confirmation-note">
            <strong>Confirmation by phone</strong>
            <p>
              We’ll call to confirm the order and payment method. Payment must be
              received before the order is marked confirmed.
            </p>
          </div>

          <section className="customer-activity">
            <div className="account-section-head"><span><Bell size={17} /> ORDER TIMELINE</span><small>{activity.length} updates</small></div>
            {activity.length ? activity.map((item, index) => (
              <article key={item.id} className={index === 0 ? 'latest' : ''}>
                <i>{index === 0 ? <CheckCircle2 size={15} /> : null}</i>
                <div>
                  <strong>{item.message || statusLabels[(item.to_status || order.status) as keyof typeof statusLabels]}</strong>
                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              </article>
            )) : <p>No timeline updates yet.</p>}
          </section>
        </section>

        <aside className="order-receipt-card">
          <span>ORDER DETAILS</span>
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
          <dl>
            <div>
              <dt>Receive by</dt>
              <dd>
                {order.fulfillment === 'delivery' ? 'Delivery' : 'Collection'}
              </dd>
            </div>
            {order.address && (
              <div>
                <dt>Address</dt>
                <dd>{order.address}</dd>
              </div>
            )}
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
              <dt>Delivery fee</dt>
              <dd>{order.delivery_fee} MAD</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{order.total} MAD</dd>
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
