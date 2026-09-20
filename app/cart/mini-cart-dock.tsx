'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from './cart-provider';

export function MiniCartDock() {
  const { items, count, subtotal } = useCart();
  const pathname = usePathname();

  if (!count || pathname === '/cart') return null;

  const latest = items[items.length - 1];

  return (
    <aside className="mini-cart-dock" aria-label="Cart summary" aria-live="polite">
      <div className="mini-cart-dock-inner">
        <div className="mini-cart-dock-icon" aria-hidden="true">
          <ShoppingBag size={17} />
          <b>{count}</b>
        </div>

        <div className="mini-cart-dock-copy">
          <span>YOUR CART</span>
          <strong>
            {count} {count === 1 ? 'item' : 'items'} · {subtotal} MAD
          </strong>
          {latest && (
            <small>
              {latest.name} · {latest.size} · Qty {latest.quantity}
              {items.length > 1 ? ` · +${items.length - 1} more` : ''}
            </small>
          )}
        </div>

        <Link className="mini-cart-dock-link" href="/cart">
          View cart <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  );
}
