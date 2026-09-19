'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  adminUpdateOrder,
  isCurrentUserAdmin,
  listAllOrders,
} from '../../lib/supabase-rest';
import {
  orderStatuses,
  statusLabels,
  type PaymentMethod,
  type StoredOrder,
} from '../../lib/order-types';
import { downloadOrderReceipt } from '../receipt-pdf';

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    setMessage('');
    const admin = await isCurrentUserAdmin();
    setAllowed(admin);
    if (admin) setOrders(await listAllOrders());
  }

  useEffect(() => {
    load().catch((error) => {
      setAllowed(false);
      setMessage(error instanceof Error ? error.message : 'Could not load orders.');
    });
  }, []);

  async function save(order: StoredOrder, form: HTMLFormElement) {
    const data = new FormData(form);
    setMessage('');
    try {
      const updated = await adminUpdateOrder(order.id, {
        status: String(data.get('status')) as StoredOrder['status'],
        payment_status: String(data.get('payment_status')) as StoredOrder['payment_status'],
        payment_method:
          String(data.get('payment_method') || '') as PaymentMethod || null,
        delivery_fee: Math.max(0, Number(data.get('delivery_fee') || 0)),
        admin_note: String(data.get('admin_note') || '').trim() || null,
      });
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`${updated.order_number} updated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update order.');
    }
  }

  if (allowed === null) {
    return <main id="main" className="commerce-flow-page"><p>Checking admin access…</p></main>;
  }

  if (!allowed) {
    return (
      <main id="main" className="commerce-flow-page">
        <section className="empty-cart">
          <ShieldCheck size={34} />
          <h1>Admin access required.</h1>
          <p>Sign in with an account that has been marked as an admin.</p>
          {message && <p className="field-error">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main id="main" className="commerce-flow-page admin-page">
      <header className="admin-head">
        <div>
          <span>MERCH ENSAM-R · ADMIN</span>
          <h1>Orders.</h1>
          <p>Review customer orders and confirm payment manually.</p>
        </div>
        <button className="secondary" onClick={() => load()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {message && <div className="system-notice">{message}</div>}

      <section className="admin-orders">
        {orders.map((order) => (
          <article className="admin-order" key={order.id}>
            <header>
              <div>
                <small>{order.order_number}</small>
                <h2>{order.customer_name}</h2>
                <p>{order.email} · {order.phone}</p>
              </div>
              <div>
                <strong>{order.total} MAD</strong>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </header>

            <div className="admin-customer-details">
              <p>
                <strong>{order.fulfillment === 'delivery' ? 'Delivery' : 'Collection'}</strong>
                {order.address && <span>{order.address}</span>}
              </p>
              {order.notes && <p><strong>Customer note</strong><span>{order.notes}</span></p>}
              {order.admin_note && <p><strong>Current admin note</strong><span>{order.admin_note}</span></p>}
            </div>

            <div className="admin-order-items">
              {order.items.map((item) => (
                <p key={`${item.slug}:${item.size}`}>
                  {item.name} · {item.color} · {item.size} · Qty {item.quantity}
                  <strong>{item.lineTotal} MAD</strong>
                </p>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                save(order, event.currentTarget);
              }}
            >
              <label>
                Order status
                <select name="status" defaultValue={order.status}>
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>{statusLabels[status]}</option>
                  ))}
                </select>
              </label>
              <label>
                Payment
                <select name="payment_status" defaultValue={order.payment_status}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </label>
              <label>
                Payment method
                <select name="payment_method" defaultValue={order.payment_method || ''}>
                  <option value="">Not selected</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </label>
              <label>
                Delivery fee (MAD)
                <input
                  name="delivery_fee"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={order.delivery_fee}
                />
              </label>
              <label className="admin-note-field">
                Internal / customer note
                <textarea name="admin_note" rows={2} defaultValue={order.admin_note || ''} />
              </label>
              <button className="primary" type="submit">Save update</button>
              <button
                className="secondary"
                type="button"
                onClick={() => downloadOrderReceipt(order)}
              >
                <Download size={16} /> Receipt
              </button>
            </form>

            {order.status !== 'cancelled' &&
              order.payment_status === 'unpaid' &&
              ['confirmed', 'preparing', 'ready', 'completed'].includes(order.status) && (
                <p className="field-error">
                  This state is invalid: payment must be marked paid before confirmation.
                </p>
              )}
          </article>
        ))}
      </section>
    </main>
  );
}
