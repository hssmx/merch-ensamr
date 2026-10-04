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
    const low = inventory.filter((row) => row.stock_on_hand - row.reserved <= row.low_stock_threshold);
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
        <article className={stats.low ? 'warning' : ''}><span>LOW STOCK</span><strong>{stats.low}</strong><p>Variants at or below threshold.</p></article>
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
  onChanged: (row: ProductInventory, tracked: boolean) => void;
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  return (
    <section className="inventory-panel">
      <header><Boxes size={22} /><div><span>INVENTORY CONTROL</span><h2>Stock by product and size.</h2><p>Tracking stays opt-in per product, so the current storefront is never blocked until counts are ready.</p></div></header>
      {message && <div className="system-notice">{message}</div>}
      <div className="inventory-table">
        {products.map((product) => <article key={product.id}>
          <div className="inventory-product"><div><span>{product.number}</span><strong>{product.name}</strong><small>{product.stockTracked ? 'Stock enforced at checkout' : 'Tracking off'}</small></div></div>
          {product.sizes.map((size) => {
            const row = rows.find((item) => item.product_id === product.id && item.size === size);
            const available = (row?.stock_on_hand || 0) - (row?.reserved || 0);
            const key = `${product.id}:${size}`;
            return <form key={size} onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setBusy(key); setMessage('');
              try {
                const tracked = data.get('tracked') === 'on';
                const next = await adminSetInventory({ product_id: product.id, size, stock_on_hand: Number(data.get('stock')), low_stock_threshold: Number(data.get('threshold')), stock_tracked: tracked });
                onChanged(next, tracked); setMessage(`${product.name} · ${size} updated.`);
              } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update stock.'); }
              finally { setBusy(''); }
            }}>
              <strong>{size}</strong><label>On hand<input name="stock" type="number" min="0" defaultValue={row?.stock_on_hand || 0} /></label><label>Reserved<input value={row?.reserved || 0} readOnly /></label><label>Low at<input name="threshold" type="number" min="0" defaultValue={row?.low_stock_threshold || 3} /></label><span className={available <= (row?.low_stock_threshold || 3) ? 'inventory-low' : ''}>{available} available</span><label className="inventory-toggle"><input name="tracked" type="checkbox" defaultChecked={product.stockTracked} /> Track</label><button disabled={busy === key}>{busy === key ? 'Saving…' : 'Save'}</button>
            </form>;
          })}
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
