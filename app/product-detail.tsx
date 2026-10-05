'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  UserRound,
  Upload,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PhotoReel from './photo-reel';
import CollectionGrid from './collection-grid';
import type { Product } from './catalog';
import type { StoredProduct } from '../lib/products';
import type { ProductInventory } from '../lib/order-types';
import { useCart } from './cart/cart-provider';
import { getSession, listProductAvailability, uploadCustomizationFiles } from '../lib/supabase-rest';

export default function ProductDetail({ product: p }: { product: Product | StoredProduct }) {
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [availability, setAvailability] = useState<ProductInventory[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void getSession().then((session) => setSignedIn(Boolean(session)));
    if ('id' in p) void listProductAvailability(p.id).then(setAvailability).catch(() => setAvailability([]));
  }, []);

  async function addToCart(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!size) {
      setError('Choose your size to continue.');
      document.getElementById('size-S')?.focus();
      return;
    }

    const row=availability.find(item=>item.size===size);
    if(row && !row.is_available){setError('That size is currently unavailable.');return;}
    const form=event.currentTarget,data=new FormData(form);
    try {
      setUploading(true);
      let customization;
      if(p.customizable){
        const description=String(data.get('customization_description')||'').trim();
        const placements=data.getAll('customization_placements').map(String);
        const artwork=data.getAll('artwork').filter((value):value is File=>value instanceof File&&value.size>0);
        const references=data.getAll('reference').filter((value):value is File=>value instanceof File&&value.size>0);
        if(description.length<3)throw new Error('Describe the customization you want.');
        if(!placements.length)throw new Error('Choose at least one placement.');
        if(artwork.length>6||references.length>2)throw new Error('Upload up to 6 artwork images and 2 reference images.');
        const requestId=crypto.randomUUID();
        const [uploadedArtwork,uploadedReferences]=await Promise.all([uploadCustomizationFiles(artwork,'artwork',requestId),uploadCustomizationFiles(references,'reference',requestId)]);
        customization={description,placements,artwork:uploadedArtwork,references:uploadedReferences};
      }
      addItem(p,size,quantity,customization);setError('');setAdded(true);
    }catch(cause){setError(cause instanceof Error?cause.message:'Could not add this customization.');}finally{setUploading(false);}
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
            <span>{p.printDetails}</span>
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
                {p.sizes.map((option) => (
                  <label
                    className={`${size === option ? 'selected' : ''} ${availability.find(row=>row.size===option)?.is_available===false?'unavailable':''}`}
                    key={option}
                  >
                    <RadioGroupItem id={`size-${option}`} value={option} disabled={availability.find(row=>row.size===option)?.is_available===false} />
                    <span>{option}</span>
                    {availability.find(row=>row.size===option)?.is_available===false&&<small>Unavailable</small>}
                    {availability.find(row=>row.size===option)?.almost_sold_out&&<small className="almost-sold-out">Almost sold out</small>}
                  </label>
                ))}
              </RadioGroup>
              {error && (
                <p id="size-error" role="alert" className="field-error">
                  {error}
                </p>
              )}
            </fieldset>

            {p.customizable&&<fieldset className="customization-field"><legend>Personalize your design</legend><p>Tell us exactly what you want. Original, high-resolution images give the best print result.</p>
              <label>Your instructions<textarea name="customization_description" rows={5} maxLength={2000} required placeholder="Describe colors, text, scale and any changes…"/></label>
              <div className="customization-placements"><span>Where should it go?</span>{(p.customizationPlacements||['Front','Back','Left sleeve','Right sleeve']).map(place=><label key={place}><input type="checkbox" name="customization_placements" value={place}/><span>{place}</span></label>)}</div>
              <div className="customization-uploads"><label><Upload size={20}/><strong>Artwork files</strong><span>Up to 6 JPG, PNG or WebP images · 20 MB each</span><input name="artwork" type="file" accept="image/jpeg,image/png,image/webp" multiple/></label><label><Upload size={20}/><strong>Placement reference</strong><span>Optional: show us where/how it should appear</span><input name="reference" type="file" accept="image/jpeg,image/png,image/webp" multiple/></label></div>
            </fieldset>}

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

            <button type="submit" className="primary order-button" disabled={uploading}>
              <span>{uploading?'Uploading artwork…':'Add to cart'}</span>
              <ShoppingBag size={19} />
            </button>

            {added && (
              <output className="product-added">
                <CheckCircle2 size={18} />
                <div>
                  <strong>Added to your cart.</strong>
                  <p>
                    {p.name} · {size} · Qty {quantity}
                  </p>
                </div>
                <Link href="/cart">
                  Open cart <ArrowRight size={15} />
                </Link>
              </output>
            )}

            <p className="payment-note">
              Checkout as a guest or with an account. No online payment is taken
              here; our team calls to confirm the order and arrange cash or bank
              payment.
            </p>
          </form>

          {signedIn === false && (
            <div className="account-product-nudge">
              <UserRound size={17} />
              <p>
                <strong>We recommend creating an account.</strong> It keeps your
                order history, tracking updates and receipts together.
              </p>
              <Link href="/account">Account</Link>
            </div>
          )}

          <div className="product-faq">
            <details>
              <summary>How do I order?</summary>
              <p>
                Choose your size and quantity, add the item to your cart, then
                check out normally. You can order as a guest or sign in for
                order tracking.
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
                Available sizes are {p.sizes.join(', ')}. You can still contact
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
