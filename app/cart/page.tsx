'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useCart } from './cart-provider';
import { CommerceSteps } from '../commerce-steps';
import { products } from '../catalog';
import { getSession } from '../../lib/supabase-rest';

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getSession().then((session) => setSignedIn(Boolean(session)));
  }, []);

  return (
    <main id="main" className="cart-page commerce-flow-page">
      <header className="commerce-flow-head">
        <Link href="/collection" className="page-back">
          <ArrowLeft size={16} /> Keep shopping
        </Link>
        <span>CART · MERCH ENSAM-R</span>
        <h1>
          Your bag<span className="commerce-title-count">{itemCount}</span>
        </h1>
        <p>
          A closer look before you send your order. Adjust quantities here; you
          can check out as a guest or keep everything in your account.
        </p>
      </header>
      <CommerceSteps current={0} />

      {!items.length ? (
        <section className="empty-cart">
          <span className="empty-cart-index" aria-hidden="true">
            00 / 00
          </span>
          <h2>Your cart is empty.</h2>
          <p>Choose a design, size and quantity from the collection.</p>
          <Link className="primary" href="/collection">
            Shop collection <ArrowRight size={18} />
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            <div className="cart-items-heading">
              <span>SELECTED PIECES</span>
              <span>
                {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </div>
            {items.map((item) => (
              <article className="cart-line" key={item.key}>
                <div className="cart-line-image">
                  <Image
                    src={
                      products
                        .find((product) => product.slug === item.slug)
                        ?.back.replace('/cutouts/', '/')
                        .replace(/\.svg$/, '.webp') || item.image
                    }
                    alt={item.name}
                    width={260}
                    height={260}
                  />
                </div>
                <div className="cart-line-copy">
                  <small>
                    {item.color} · SIZE {item.size}
                  </small>
                  <h2>{item.name}</h2>
                  <p>{item.unitPrice} MAD each</p>
                  <div className="cart-line-actions">
                    <div className="quantity-input">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                      >
                        <Minus size={15} />
                      </button>
                      <input
                        aria-label={`Quantity for ${item.name}`}
                        type="number"
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(event) =>
                          setQuantity(item.key, Number(event.target.value) || 1)
                        }
                      />
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={item.quantity >= 99}
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
                <strong
                  aria-label={`Line total ${item.unitPrice * item.quantity} MAD`}
                >
                  {item.unitPrice * item.quantity} <small>MAD</small>
                </strong>
              </article>
            ))}
          </section>

          <aside className="cart-summary">
            <span>ORDER SUMMARY</span>
            <div className="commerce-summary-heading">
              Your order
              <span>
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
              </span>
            </div>
            <dl>
              <div>
                <dt>Items subtotal</dt>
                <dd>{subtotal} MAD</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>Confirmed by team</dd>
              </div>
              <div className="cart-total">
                <dt>Current total</dt>
                <dd>{subtotal} MAD</dd>
              </div>
            </dl>
            <Link className="primary cart-checkout" href="/checkout">
              Continue to checkout <ArrowRight size={18} />
            </Link>
            <p className="commerce-summary-note">
              No payment is taken online. We’ll confirm availability and the
              final amount with you.
            </p>
            {signedIn === false && (
              <div className="account-nudge">
                <UserRound size={20} />
                <div>
                  <strong>Want order tracking?</strong>
                  <p>
                    Create an account before or after checkout. Your latest guest
                    order from this browser will be attached automatically once
                    you sign in.
                  </p>
                  <Link href="/account">Create account / sign in</Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
