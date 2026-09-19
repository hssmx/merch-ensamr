'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PhotoReel from './photo-reel';
import CollectionGrid from './collection-grid';
import type { Product } from './catalog';
import { useCart } from './cart/cart-provider';

export default function ProductDetail({ product: p }: { product: Product }) {
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  function addToCart(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!size) {
      setError('Choose your size to continue.');
      document.getElementById('size-S')?.focus();
      return;
    }

    addItem(p, size, quantity);
    setError('');
    setAdded(true);
  }

  return (
    <main id="main" className="product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/collection">
          <ArrowLeft size={15} /> Collection
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>

      <div className="product-layout">
        <section className="product-gallery" aria-label="Product photographs">
          <PhotoReel product={p} />
        </section>

        <section className="product-info">
          <small>THE ENSAM ORIGINALS</small>
          <h1>{p.name}</h1>
          <p className="detail-price">
            {p.price} <span>MAD</span>
          </p>
          <p className="product-description">{p.description}</p>

          <div className="fixed-color">
            <span
              className="color-dot"
              style={{ background: p.color === 'Black' ? '#161616' : '#fff' }}
            />
            {p.color}
            <span>Front & back printed</span>
          </div>

          <form onSubmit={addToCart}>
            <fieldset className="size-field">
              <legend>Choose your size</legend>
              <RadioGroup
                value={size}
                onValueChange={(value) => {
                  setSize(String(value));
                  setError('');
                  setAdded(false);
                }}
                aria-label="T-shirt size"
                aria-describedby={error ? 'size-error' : undefined}
                className="size-options"
              >
                {['S', 'M', 'L', 'XL', 'XXL'].map((option) => (
                  <label className={size === option ? 'selected' : ''} key={option}>
                    <RadioGroupItem id={`size-${option}`} value={option} />
                    <span>{option}</span>
                  </label>
                ))}
              </RadioGroup>
              {error && (
                <p id="size-error" role="alert" className="field-error">
                  {error}
                </p>
              )}
            </fieldset>

            <div className="quantity-line">
              <label htmlFor="quantity">Quantity</label>
              <div className="quantity-input">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => {
                    setQuantity((value) => value - 1);
                    setAdded(false);
                  }}
                >
                  <Minus size={16} />
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  required
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(
                      Number.isFinite(value)
                        ? Math.max(1, Math.min(99, Math.floor(value)))
                        : 1,
                    );
                    setAdded(false);
                  }}
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 99}
                  onClick={() => {
                    setQuantity((value) => value + 1);
                    setAdded(false);
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="subtotal" aria-live="polite">
              <span>Items subtotal</span>
              <strong>{p.price * quantity} MAD</strong>
            </div>

            <button type="submit" className="primary order-button">
              <span>Add to cart</span>
              <ShoppingBag size={19} />
            </button>

            {added && (
              <div className="product-added" role="status">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Added to your cart.</strong>
                  <p>{p.name} · {size} · Qty {quantity}</p>
                </div>
                <Link href="/cart">Open cart <ArrowRight size={15} /></Link>
              </div>
            )}

            <p className="payment-note">
              Checkout as a guest or with an account. No online payment is taken
              here; our team calls to confirm the order and arrange cash or bank
              payment.
            </p>
          </form>

          <div className="account-product-nudge">
            <UserRound size={17} />
            <p>
              <strong>We recommend creating an account.</strong> It keeps your
              order history, tracking updates and receipts together.
            </p>
            <Link href="/account">Account</Link>
          </div>

          <div className="product-faq">
            <details>
              <summary>How do I order?</summary>
              <p>
                Choose your size and quantity, add the item to your cart, then
                check out normally. You can order as a guest or sign in for order
                tracking.
              </p>
            </details>
            <details>
              <summary>How is my order confirmed?</summary>
              <p>
                Website admins review orders manually. Expect a call from our
                team to confirm availability, collection or delivery, and the
                payment method. Payment is required before an order is marked
                confirmed.
              </p>
            </details>
            <details>
              <summary>How do payment and delivery work?</summary>
              <p>
                The team will propose cash or bank transfer during the
                confirmation call. Any delivery fee is also confirmed with you
                before the order is confirmed.
              </p>
            </details>
            <details>
              <summary>Need help with sizing?</summary>
              <p>
                Available sizes are S, M, L, XL and XXL. You can still contact
                our team directly if you need measurements or product help.
              </p>
            </details>
          </div>
        </section>
      </div>

      <section className="more-designs">
        <div className="section-heading">
          <div>
            <small>KEEP EXPLORING</small>
            <h2>The rest of the collection.</h2>
          </div>
          <Link href="/collection">
            View all <ArrowRight size={17} />
          </Link>
        </div>
        <CollectionGrid
          excludeSlug={p.slug}
          className="related-commerce-grid"
        />
      </section>
    </main>
  );
}
