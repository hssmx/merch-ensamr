'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Boxes, ShieldCheck, Users } from 'lucide-react';
import type { StoredProduct } from '../../lib/products';
import type {
  CustomerProfile,
  OrderActivity,
  ProductInventory,
  StaffRole,
  StoredOrder,
} from '../../lib/order-types';
import { adminSetInventory, adminSetStaffRole } from '../../lib/supabase-rest';

export function AdminOverview({ orders, inventory, activity }: {
  orders: StoredOrder[];
  inventory: ProductInventory[];
  activity: OrderActivity[];
}) {
  const stats = useMemo(() => {
    const active = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
    const revenue = orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + order.total, 0);
    const units = orders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
    const low = inventory.filter((row) => row.almost_sold_out || !row.is_available);
    return { active: active.length, revenue, units, low: low.length };
  }, [orders, inventory]);

  const statusMix = useMemo(() => Object.entries(orders.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] || 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]), [orders]);

  return (
    <section className="admin-overview">
      <div className="admin-stat-grid">
        <article><span>ACTIVE ORDERS</span><strong>{stats.active}</strong><p>Open work across every queue.</p></article>
        <article><span>PAID VALUE</span><strong>{stats.revenue} <small>MAD</small></strong><p>Gross value of paid orders.</p></article>
        <article><span>UNITS ORDERED</span><strong>{stats.units}</strong><p>Non-cancelled pieces.</p></article>
        <article className={stats.low ? 'warning' : ''}><span>STOCK ATTENTION</span><strong>{stats.low}</strong><p>Unavailable or almost sold-out sizes.</p></article>
      </div>
      <div className="admin-overview-grid">
        <section>
          <header><BarChart3 size={18} /><div><span>WORKFLOW MIX</span><h2>Orders by status.</h2></div></header>
          <div className="status-bars">{statusMix.map(([status, count]) => <div key={status}><span>{status.replaceAll('_', ' ')}</span><i><b style={{ width: `${orders.length ? (count / orders.length) * 100 : 0}%` }} /></i><strong>{count}</strong></div>)}</div>
        </section>
        <section>
          <header><ShieldCheck size={18} /><div><span>RECENT ACTIVITY</span><h2>What changed.</h2></div></header>
          <div className="activity-feed">{activity.slice(0, 8).map((item) => <article key={item.id}><i /><div><strong>{item.message || item.event_type.replaceAll('_', ' ')}</strong><small>{item.actor_role || 'System'} · {new Date(item.created_at).toLocaleString('en-GB')}</small></div></article>)}</div>
        </section>
      </div>
    </section>
  );
}

export function InventoryManager({ products, rows, onChanged }: {
  products: StoredProduct[];
  rows: ProductInventory[];
  onChanged: (row: ProductInventory) => void;
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  return (
    <section className="inventory-panel">
      <header><Boxes size={22} /><div><span>AVAILABILITY CONTROL</span><h2>Availability by product and size.</h2><p>Switch a size off to disable it in the storefront. “Almost sold out” adds a customer-facing urgency label.</p></div></header>
      {message && <div className="system-notice">{message}</div>}
      <div className="inventory-table">
        {products.map((product) => <article key={product.id}>
          <div className="inventory-product"><div><span>{product.number}</span><strong>{product.name}</strong><small>Live storefront availability</small></div></div>
          <div className="inventory-size-grid">{product.sizes.map((size) => {
            const row = rows.find((item) => item.product_id === product.id && item.size === size);
            const key = `${product.id}:${size}`;
            return <form className={`${row?.is_available===false?'is-unavailable':''} ${row?.almost_sold_out?'is-low':''}`} key={size} onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setBusy(key); setMessage('');
              try {
                const next = await adminSetInventory({ product_id: product.id, size, is_available: data.get('available') === 'on', almost_sold_out: data.get('almost') === 'on' });
                onChanged(next); setMessage(`${product.name} · ${size} updated.`);
              } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update stock.'); }
              finally { setBusy(''); }
            }}>
              <div className="inventory-size-name"><strong>{size}</strong><small>{row?.is_available===false?'Hidden from sale':row?.almost_sold_out?'Customer urgency shown':'Ready to order'}</small></div><label className="inventory-toggle"><span><b>Available</b><small>Customers can select this size</small></span><input name="available" type="checkbox" defaultChecked={row?.is_available ?? true} /><i /></label><label className="inventory-toggle"><span><b>Almost sold out</b><small>Show a low-stock message</small></span><input name="almost" type="checkbox" defaultChecked={row?.almost_sold_out ?? false} /><i /></label><button disabled={busy === key}>{busy === key ? 'Saving…' : 'Save size'}</button>
            </form>;
          })}</div>
        </article>)}
      </div>
    </section>
  );
}

export function TeamManager({ people, currentRole, onChanged }: {
  people: CustomerProfile[];
  currentRole: StaffRole;
  onChanged: (profile: CustomerProfile) => void;
}) {
  const [message, setMessage] = useState('');
  return <section className="team-panel">
    <header><Users size={22} /><div><span>ACCESS CONTROL</span><h2>Team roles.</h2><p>Support handles customers, fulfillment manages orders and stock, managers also manage products and analytics, and owners control team access.</p></div></header>
    {currentRole !== 'owner' && <div className="system-notice"><AlertTriangle size={16} /> Only an owner can change roles.</div>}
    {message && <div className="system-notice">{message}</div>}
    <div className="team-list">{people.map((person) => <article key={person.id}><span><strong>{person.full_name || person.email || 'Team member'}</strong><small>{person.email}</small></span><select value={person.role} disabled={currentRole !== 'owner'} onChange={async (event) => { try { const next = await adminSetStaffRole(person.id, event.target.value as StaffRole); onChanged(next); setMessage(`${next.full_name || next.email} is now ${next.role}.`); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not change role.'); } }}><option value="customer">Customer</option><option value="support">Support</option><option value="fulfillment">Fulfillment</option><option value="manager">Manager</option><option value="owner">Owner</option></select></article>)}</div>
  </section>;
}
