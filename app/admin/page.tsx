'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Mail,
  PackagePlus,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Truck,
} from 'lucide-react';
import {
  adminUpdateOrder,
  isCurrentUserAdmin,
  listAllOrders,
} from '../../lib/supabase-rest';
import {
  orderStatuses,
  statusLabels,
  type OrderStatus,
  type PaymentMethod,
  type StoredOrder,
} from '../../lib/order-types';
import { downloadOrderReceipt } from '../receipt-pdf';
import ProductManager from './product-manager';
import { listAdminProducts, type StoredProduct } from '../../lib/products';

type OrderQueue =
  | 'attention'
  | 'active'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'all';
type OrderSort = 'priority' | 'newest' | 'oldest' | 'value';

const queueLabels: Record<OrderQueue, string> = {
  attention: 'Needs action',
  active: 'In progress',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  all: 'All orders',
};

const priorityRank: Record<OrderStatus, number> = {
  pending_confirmation: 0,
  awaiting_payment: 1,
  ready: 2,
  confirmed: 3,
  preparing: 4,
  completed: 5,
  cancelled: 6,
};

function formText(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function needsAttention(order: StoredOrder) {
  return (
    order.status === 'pending_confirmation' ||
    order.status === 'awaiting_payment' ||
    (order.payment_status === 'unpaid' &&
      ['confirmed', 'preparing', 'ready', 'completed'].includes(order.status))
  );
}

function isOverdue(order: StoredOrder) {
  return (
    needsAttention(order) &&
    Date.now() - new Date(order.created_at).getTime() > 24 * 60 * 60 * 1000
  );
}

function queueForOrder(order: StoredOrder): OrderQueue {
  if (needsAttention(order)) return 'attention';
  if (order.status === 'ready') return 'ready';
  if (order.status === 'completed') return 'completed';
  if (order.status === 'cancelled') return 'cancelled';
  return 'active';
}

function relativeAge(date: string) {
  const elapsed = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : undefined;
}

export default function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [view, setView] = useState<'orders' | 'products'>('orders');
  const [queue, setQueue] = useState<OrderQueue>('attention');
  const [sort, setSort] = useState<OrderSort>('priority');
  const [query, setQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    setMessage('');
    const admin = await isCurrentUserAdmin();
    setAllowed(admin);
    if (!admin) return;

    const [ordersResult, productsResult] = await Promise.allSettled([
      listAllOrders(),
      listAdminProducts(),
    ]);
    if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
    if (productsResult.status === 'fulfilled') setProducts(productsResult.value);

    const failedSections = [
      ordersResult.status === 'rejected' ? 'orders' : null,
      productsResult.status === 'rejected' ? 'products' : null,
    ].filter(Boolean);
    if (failedSections.length) {
      setMessage(
        `Admin access verified, but ${failedSections.join(' and ')} could not be loaded. Try Refresh.`,
      );
    }
  }

  function handleLoadError(error: unknown) {
    setAllowed(false);
    setMessage(
      error instanceof Error
        ? `Could not verify admin access: ${error.message}`
        : 'Could not verify admin access.',
    );
  }

  useEffect(() => {
    // oxlint-disable-next-line react-compiler/react-compiler
    void load().catch(handleLoadError);
  }, []);

  const queueCounts = useMemo(() => {
    const counts: Record<OrderQueue, number> = {
      attention: 0,
      active: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
      all: orders.length,
    };
    orders.forEach((order) => {
      counts[queueForOrder(order)] += 1;
    });
    return counts;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const inQueue = queue === 'all' || queueForOrder(order) === queue;
      if (!inQueue) return false;
      if (!normalizedQuery) return true;
      return [
        order.order_number,
        order.customer_name,
        order.email,
        order.phone,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sort === 'value') return b.total - a.total;
      if (sort === 'priority') {
        const overdueDifference = Number(isOverdue(b)) - Number(isOverdue(a));
        if (overdueDifference) return overdueDifference;
        const priorityDifference = priorityRank[a.status] - priorityRank[b.status];
        if (priorityDifference) return priorityDifference;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [orders, query, queue, sort]);

  const selectedOrder =
    visibleOrders.find((order) => order.id === selectedOrderId) ??
    visibleOrders[0] ??
    null;

  async function save(order: StoredOrder, form: HTMLFormElement) {
    const data = new FormData(form);
    const nextStatus = formText(data, 'status') as StoredOrder['status'];
    const nextPaymentStatus = formText(
      data,
      'payment_status',
    ) as StoredOrder['payment_status'];
    setMessage('');
    if (
      nextPaymentStatus === 'unpaid' &&
      ['confirmed', 'preparing', 'ready', 'completed'].includes(nextStatus)
    ) {
      setMessage('Mark the order as paid before moving it into fulfilment.');
      return;
    }
    setSavingOrderId(order.id);
    try {
      const updated = await adminUpdateOrder(order.id, {
        status: nextStatus,
        payment_status: nextPaymentStatus,
        payment_method:
          (formText(data, 'payment_method') as PaymentMethod) || null,
        delivery_fee: Math.max(0, Number(data.get('delivery_fee') || 0)),
        admin_note: formText(data, 'admin_note').trim() || null,
      });
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedOrderId(updated.id);
      setMessage(`${updated.order_number} updated successfully.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not update order.',
      );
    } finally {
      setSavingOrderId(null);
    }
  }

  if (allowed === null) {
    return (
      <main id="main" className="commerce-flow-page">
        <p>Checking admin access…</p>
      </main>
    );
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
          <h1>{view === 'orders' ? 'Order desk.' : 'Products.'}</h1>
          <p>
            {view === 'orders'
              ? 'One focused queue for every order that still needs the team.'
              : 'Create products, upload imagery and prepare the next release.'}
          </p>
        </div>
        <button className="secondary" onClick={() => void load().catch(handleLoadError)}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      {message && <div className="system-notice">{message}</div>}

      <nav className="admin-tabs" aria-label="Admin sections">
        <button className={view === 'orders' ? 'active' : ''} onClick={() => setView('orders')}>
          <ShoppingBag size={17} /> Orders <span>{orders.length}</span>
        </button>
        <button className={view === 'products' ? 'active' : ''} onClick={() => setView('products')}>
          <PackagePlus size={17} /> Products <span>{products.length}</span>
        </button>
      </nav>

      {view === 'products' ? (
        <ProductManager
          products={products}
          onCreated={(product) =>
            setProducts((current) =>
              [...current, product].sort((a, b) => a.sortOrder - b.sortOrder),
            )
          }
        />
      ) : (
        <section className="order-desk">
          <div className="order-command-bar">
            <div className="order-queue-tabs" aria-label="Order queues">
              {(Object.keys(queueLabels) as OrderQueue[]).map((item) => (
                <button
                  type="button"
                  className={queue === item ? 'active' : ''}
                  aria-pressed={queue === item}
                  key={item}
                  onClick={() => setQueue(item)}
                >
                  <span>{queueLabels[item]}</span>
                  <strong>{queueCounts[item]}</strong>
                </button>
              ))}
            </div>
            <div className="order-tools">
              <label className="order-search">
                <Search size={16} />
                <span className="sr-only">Search orders</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Order, customer, phone or email"
                />
              </label>
              <label className="order-sort">
                <SlidersHorizontal size={15} />
                <span className="sr-only">Sort orders</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as OrderSort)}>
                  <option value="priority">Priority first</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="value">Highest value</option>
                </select>
              </label>
            </div>
          </div>

          <div className="order-desk-meta">
            <div>
              <span className={`queue-signal queue-${queue}`} />
              <strong>{queueLabels[queue]}</strong>
              <p>
                {visibleOrders.length} {visibleOrders.length === 1 ? 'order' : 'orders'}
                {query ? ' matching your search' : ''}
              </p>
            </div>
            {queueCounts.attention > 0 && queue !== 'attention' && (
              <button type="button" onClick={() => setQueue('attention')}>
                <AlertCircle size={15} /> {queueCounts.attention} still need action
              </button>
            )}
          </div>

          {!visibleOrders.length ? (
            <div className="order-queue-empty">
              <CheckCircle2 size={28} />
              <h2>{query ? 'No matching orders.' : 'This queue is clear.'}</h2>
              <p>
                {query
                  ? 'Try another customer name, phone number or order reference.'
                  : 'There is nothing waiting in this stage right now.'}
              </p>
            </div>
          ) : (
            <div className="order-workspace">
              <div className="order-inbox" aria-label="Orders">
                {visibleOrders.map((order) => {
                  const overdue = isOverdue(order);
                  return (
                    <button
                      type="button"
                      aria-pressed={selectedOrder?.id === order.id}
                      className={`order-inbox-row ${selectedOrder?.id === order.id ? 'selected' : ''} ${overdue ? 'overdue' : ''}`}
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <span className="order-row-leading">
                        <i className={`status-dot status-${order.status}`} />
                        <span><small>{order.order_number}</small><strong>{order.customer_name}</strong></span>
                      </span>
                      <span className="order-row-state">
                        <b>{statusLabels[order.status]}</b>
                        <small className={`payment-${order.payment_status}`}>
                          {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </small>
                      </span>
                      <span className="order-row-summary">
                        <strong>{order.total} MAD</strong>
                        <small>{order.items.length} line{order.items.length === 1 ? '' : 's'}</small>
                      </span>
                      <span className="order-row-age">
                        {overdue && <b>OVERDUE</b>}
                        <small>{relativeAge(order.created_at)}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedOrder && (
                <aside className="order-inspector" aria-label="Selected order details">
                  <header>
                    <div>
                      <span>{selectedOrder.order_number}</span>
                      <h2>{selectedOrder.customer_name}</h2>
                      <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                    <strong>{selectedOrder.total} MAD</strong>
                  </header>
                  <div className="order-contact-strip">
                    <a href={`tel:${selectedOrder.phone}`}><Phone size={15} /> Call</a>
                    <a href={whatsappUrl(selectedOrder.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
                    <a href={`mailto:${selectedOrder.email}`}><Mail size={15} /> Email</a>
                  </div>
                  <section className="order-customer-card">
                    <div>
                      {selectedOrder.fulfillment === 'delivery' ? <Truck size={17} /> : <Store size={17} />}
                      <span>
                        <small>FULFILMENT</small>
                        <strong>{selectedOrder.fulfillment === 'delivery' ? 'Delivery' : 'Collection'}</strong>
                      </span>
                    </div>
                    {selectedOrder.address && <p>{selectedOrder.address}</p>}
                    <p>{selectedOrder.phone}</p>
                    <p>{selectedOrder.email}</p>
                  </section>
                  {(selectedOrder.notes || selectedOrder.admin_note) && (
                    <section className="order-notes">
                      {selectedOrder.notes && <div><small>CUSTOMER NOTE</small><p>{selectedOrder.notes}</p></div>}
                      {selectedOrder.admin_note && <div><small>LATEST TEAM UPDATE</small><p>{selectedOrder.admin_note}</p></div>}
                    </section>
                  )}
                  <section className="order-line-items">
                    <div className="order-section-label">
                      <span>ORDER ITEMS</span>
                      <strong>{selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</strong>
                    </div>
                    {selectedOrder.items.map((item) => (
                      <div key={`${item.slug}:${item.size}`}>
                        <span><strong>{item.name}</strong><small>{item.color} · {item.size} · Qty {item.quantity}</small></span>
                        <b>{item.lineTotal} MAD</b>
                      </div>
                    ))}
                  </section>
                  <form
                    key={`${selectedOrder.id}:${selectedOrder.updated_at}`}
                    className="order-update-form"
                    onSubmit={(event) => { event.preventDefault(); void save(selectedOrder, event.currentTarget); }}
                  >
                    <div className="order-section-label">
                      <span>WORKFLOW UPDATE</span>
                      {isOverdue(selectedOrder) && <strong className="overdue-label"><Clock3 size={13} /> Waiting over 24h</strong>}
                    </div>
                    <div className="order-form-grid">
                      <label>Order status<select name="status" defaultValue={selectedOrder.status}>{orderStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
                      <label>Payment<select name="payment_status" defaultValue={selectedOrder.payment_status}><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select></label>
                      <label>Payment method<select name="payment_method" defaultValue={selectedOrder.payment_method || ''}><option value="">Not selected</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option></select></label>
                      <label>Delivery fee<span className="money-field"><input name="delivery_fee" type="number" min="0" step="1" defaultValue={selectedOrder.delivery_fee} /><i>MAD</i></span></label>
                    </div>
                    <label className="admin-note-field">
                      Customer-facing update
                      <textarea name="admin_note" rows={3} defaultValue={selectedOrder.admin_note || ''} placeholder="Add the next useful update for this customer…" />
                    </label>
                    <div className="order-form-actions">
                      <button className="primary" type="submit" disabled={savingOrderId === selectedOrder.id}>
                        {savingOrderId === selectedOrder.id ? 'Saving…' : 'Save update'}
                      </button>
                      <button className="secondary" type="button" onClick={() => downloadOrderReceipt(selectedOrder)}>
                        <Download size={16} /> Receipt
                      </button>
                    </div>
                  </form>
                  {selectedOrder.status !== 'cancelled' && selectedOrder.payment_status === 'unpaid' && ['confirmed', 'preparing', 'ready', 'completed'].includes(selectedOrder.status) && (
                    <p className="order-state-warning"><AlertCircle size={15} /> Payment must be marked paid before this fulfilment stage can be saved.</p>
                  )}
                </aside>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
