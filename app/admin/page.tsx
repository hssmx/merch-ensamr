'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  adminUpdateDeletionRequest,
  adminUpdateOrder,
  isCurrentUserAdmin,
  listAllOrders,
  listDeletionRequests,
  type AccountDeletionRequest,
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
  const [privacyRequests, setPrivacyRequests] = useState<AccountDeletionRequest[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    setMessage('');
    const admin = await isCurrentUserAdmin();
    setAllowed(admin);
    if (!admin) return;

    const [allOrders, allPrivacyRequests] = await Promise.all([
      listAllOrders(),
      listDeletionRequests(),
    ]);
    setOrders(allOrders);
    setPrivacyRequests(allPrivacyRequests);
  }

  useEffect(() => {
    load().catch((error) => {
      setAllowed(false);
      setMessage(error instanceof Error ? error.message : 'Could not load admin dashboard.');
    });
  }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === 'pending_confirmation').length,
    awaitingPayment: orders.filter((order) => order.status === 'awaiting_payment').length,
    privacy: privacyRequests.filter((item) => item.status === 'pending' || item.status === 'in_review').length,
  }), [orders, privacyRequests]);

  async function saveOrder(order: StoredOrder, form: HTMLFormElement) {
    const data = new FormData(form);
    setMessage('');
    try {
      const updated = await adminUpdateOrder(order.id, {
        status: String(data.get('status')) as StoredOrder['status'],
        payment_status: String(data.get('payment_status')) as StoredOrder['payment_status'],
        payment_method:
          (String(data.get('payment_method') || '') as PaymentMethod) || null,
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

  async function savePrivacyRequest(request: AccountDeletionRequest, form: HTMLFormElement) {
    const data = new FormData(form);
    setMessage('');
    try {
      const updated = await adminUpdateDeletionRequest(request.id, {
        status: String(data.get('status')) as AccountDeletionRequest['status'],
        admin_note: String(data.get('admin_note') || '').trim() || null,
      });
      setPrivacyRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage('Privacy request updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update privacy request.');
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
          <p>Sign in with the account marked as an administrator.</p>
          <Link className="primary" href="/account">Open account</Link>
          {message && <p className="field-error">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main id="main" className="commerce-flow-page admin-page">
      <header className="admin-head">
        <div>
          <Link href="/account" className="page-back"><ArrowLeft size={16} /> Account</Link>
          <span>MERCH ENSAM-R · ADMIN</span>
          <h1>Dashboard.</h1>
          <p>Orders, payment confirmation and customer privacy requests.</p>
        </div>
        <button className="secondary" onClick={() => load()}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <section className="admin-summary" aria-label="Admin summary">
        <div><span>Total orders</span><strong>{stats.total}</strong></div>
        <div><span>New orders</span><strong>{stats.pending}</strong></div>
        <div><span>Awaiting payment</span><strong>{stats.awaitingPayment}</strong></div>
        <div><span>Privacy requests</span><strong>{stats.privacy}</strong></div>
      </section>

      {message && <div className="system-notice">{message}</div>}

      <div className="admin-section-head">
        <div>
          <h2>Orders</h2>
          <p>Newest orders first.</p>
        </div>
      </div>

      <section className="admin-orders">
        {!orders.length && <p>No orders yet.</p>}
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
              {order.admin_note && <p><strong>Current team note</strong><span>{order.admin_note}</span></p>}
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
                saveOrder(order, event.currentTarget);
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
                <input name="delivery_fee" type="number" min="0" step="1" defaultValue={order.delivery_fee} />
              </label>
              <label className="admin-note-field">
                Customer-visible update
                <textarea name="admin_note" rows={2} defaultValue={order.admin_note || ''} />
              </label>
              <button className="primary" type="submit">Save update</button>
              <button className="secondary" type="button" onClick={() => downloadOrderReceipt(order)}>
                <Download size={16} /> Receipt
              </button>
            </form>
          </article>
        ))}
      </section>

      <div className="admin-section-head">
        <div>
          <h2>Privacy requests</h2>
          <p>Account deletion requests submitted by signed-in customers.</p>
        </div>
      </div>

      <section className="admin-privacy-list">
        {!privacyRequests.length && <p>No privacy requests.</p>}
        {privacyRequests.map((request) => (
          <article className="admin-privacy-request" key={request.id}>
            <header>
              <div>
                <small>{request.status.replace('_', ' ').toUpperCase()}</small>
                <h3>{request.email}</h3>
              </div>
              <Trash2 size={18} />
            </header>
            <p>{request.reason || 'No reason provided.'}</p>
            <small>Requested {new Date(request.created_at).toLocaleString()}</small>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                savePrivacyRequest(request, event.currentTarget);
              }}
            >
              <label>
                Status
                <select name="status" defaultValue={request.status}>
                  <option value="pending">Pending</option>
                  <option value="in_review">In review</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <label>
                Internal note
                <input name="admin_note" defaultValue={request.admin_note || ''} maxLength={500} />
              </label>
              <button className="secondary" type="submit">Save privacy request</button>
            </form>
            <p>
              Mark “completed” only after the account has actually been removed from Supabase Auth
              or the request has otherwise been fulfilled. Order records may remain where retention is legally required.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
