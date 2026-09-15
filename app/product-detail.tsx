'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  MessageCircle,
  Minus,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PhotoReel from './photo-reel';
import { products, orderMessage, whatsappUrl, type Product } from './catalog';
import { shopConfig } from './shop-config';
export default function ProductDetail({ product: p }: { product: Product }) {
  const [view, setView] = useState('back'),
    [size, setSize] = useState(''),
    [quantity, setQuantity] = useState(1),
    [zoom, setZoom] = useState(false),
    [review, setReview] = useState(false),
    [error, setError] = useState(''),
    [status, setStatus] = useState('');
  const message = size ? orderMessage(p, size, quantity) : '';
  const contacts = shopConfig.whatsappContacts
    .map((c) => ({ ...c, url: whatsappUrl(c.phone, message) }))
    .filter((c) => c.url);
  function prepare(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!size) {
      setError('Choose your size to continue.');
      document.getElementById('size-S')?.focus();
      return;
    }
    setError('');
    setStatus('');
    setReview(true);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setStatus('Order details copied.');
    } catch {
      setStatus(
        'Copy is unavailable in this browser. Download the order details instead.',
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([message], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.slug}-order.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Order details downloaded. This does not place an order.');
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
          <PhotoReel
            product={p}
            onEnlarge={(v) => {
              setView(v);
              setZoom(true);
            }}
          />
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
          <form onSubmit={prepare}>
            <fieldset className="size-field">
              <legend>Choose your size</legend>
              <RadioGroup
                value={size}
                onValueChange={(v) => {
                  setSize(String(v));
                  setError('');
                }}
                aria-label="T-shirt size"
                aria-describedby={error ? 'size-error' : undefined}
                className="size-options"
              >
                {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                  <label className={size === s ? 'selected' : ''} key={s}>
                    <RadioGroupItem id={`size-${s}`} value={s} />
                    <span>{s}</span>
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
                  onClick={() => setQuantity((q) => q - 1)}
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
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQuantity(
                      Number.isFinite(n)
                        ? Math.max(1, Math.min(99, Math.floor(n)))
                        : 1,
                    );
                  }}
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 99}
                  onClick={() => setQuantity((q) => q + 1)}
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
              Review your order <ArrowRight size={20} />
            </button>
            <p className="payment-note">
              <MessageCircle size={16} /> Order confirmation & payment via
              WhatsApp.
            </p>
          </form>
          <div className="product-faq">
            <details>
              <summary>How do I order?</summary>
              <p>
                Choose your size and quantity, then review your order. Select a
                WhatsApp contact and send the prepared message. Your order is
                confirmed directly with our team.
              </p>
              {!contacts.length && (
                <p>
                  WhatsApp ordering opens soon. You can prepare and save your
                  order details now.
                </p>
              )}
            </details>
            <details>
              <summary>Delivery & payment</summary>
              <p>
                Delivery or collection arrangements, any delivery fees, and
                payment instructions are confirmed with the team on WhatsApp.
                The subtotal above covers the T-shirts only.
              </p>
            </details>
            <details>
              <summary>Need help with sizing?</summary>
              <p>
                Available sizes: S, M, L, XL and XXL. Ask our team for
                measurements before confirming if you are unsure of your fit.
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
        <div className="related-grid">
          {products
            .filter((x) => x.slug !== p.slug)
            .map((x) => (
              <Link key={x.slug} href={`/collection/${x.slug}`}>
                <Image
                  src={x.back}
                  alt={`${x.name}, back view`}
                  width="1500"
                  height="1500"
                  loading="lazy"
                />
                <div>
                  <h3>{x.name}</h3>
                  <span>{x.price} MAD ↗</span>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="photo-dialog">
          <DialogTitle>{p.name}</DialogTitle>
          <DialogDescription>
            {view === 'back' ? 'Back' : 'Front'} view · {p.color}
          </DialogDescription>
          <Image
            src={view === 'back' ? p.back : p.front}
            alt={`${p.name}, enlarged ${view} view`}
            width="1500"
            height="1500"
          />
          <p className="zoom-view-note">Close to explore the other side.</p>
        </DialogContent>
      </Dialog>
      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent className="order-dialog">
          <DialogTitle>Your order summary</DialogTitle>
          <DialogDescription>
            Review your selection before contacting our team.
          </DialogDescription>
          <div className="order-product">
            <Image src={p.back} alt={p.name} width="100" height="100" />
            <div>
              <strong>{p.name}</strong>
              <p>
                {p.color} / {size} / Qty {quantity}
              </p>
            </div>
          </div>
          <dl className="order-totals">
            <div>
              <dt>Unit price</dt>
              <dd>{p.price} MAD</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{quantity}</dd>
            </div>
            <div>
              <dt>Items subtotal</dt>
              <dd>{p.price * quantity} MAD</dd>
            </div>
          </dl>
          <p className="order-delivery">
            Delivery fees, if applicable, are confirmed separately.
          </p>
          {contacts.length ? (
            <div className="contact-options">
              <p>Choose a WhatsApp contact:</p>
              {contacts.map((c) => (
                <a
                  key={c.phone}
                  className="primary"
                  href={c.url!}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={18} />
                  <span>
                    {c.name}
                    <small>{c.role}</small>
                  </span>
                  <ArrowRight size={18} />
                </a>
              ))}
            </div>
          ) : (
            <div className="order-unavailable">
              <MessageCircle size={22} />
              <div>
                <strong>WhatsApp ordering opens soon.</strong>
                <p>
                  Save your selection below. No order has been placed and no
                  payment is due.
                </p>
              </div>
            </div>
          )}
          <div className="order-save">
            <button className="secondary" onClick={copy}>
              <Copy size={16} /> Copy details
            </button>
            <button className="secondary" onClick={download}>
              <Download size={16} /> Download
            </button>
          </div>
          <output className="copy-status">
            {status && <Check size={15} />} {status}
          </output>
        </DialogContent>
      </Dialog>
    </main>
  );
}
