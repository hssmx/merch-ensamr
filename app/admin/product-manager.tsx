'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ImagePlus, PackagePlus } from 'lucide-react';
import {
  adminCreateProduct,
  type NewProductInput,
  type StoredProduct,
} from '../../lib/products';

const allSizes = ['S', 'M', 'L', 'XL', 'XXL'];

function fieldText(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function fieldFile(data: FormData, name: string) {
  const value = data.get(name);
  if (!(value instanceof File) || !value.size) {
    throw new Error(`Add the ${name} image.`);
  }
  return value;
}

export default function ProductManager({
  products,
  onCreated,
}: {
  products: StoredProduct[];
  onCreated: (product: StoredProduct) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const nextNumber = useMemo(
    () =>
      String(
        Math.max(0, ...products.map((product) => Number(product.number) || 0)) +
          1,
      ).padStart(2, '0'),
    [products],
  );

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const sizes = allSizes.filter((size) =>
        data.getAll('sizes').includes(size),
      );
      if (!sizes.length) throw new Error('Choose at least one available size.');

      const input: NewProductInput = {
        name: fieldText(data, 'name'),
        slug: fieldText(data, 'slug').toLowerCase(),
        price: Number(fieldText(data, 'price')),
        color: fieldText(data, 'color'),
        description: fieldText(data, 'description'),
        printDetails: fieldText(data, 'print_details'),
        number: fieldText(data, 'number'),
        sortOrder: Number(fieldText(data, 'sort_order')),
        sizes,
        status: data.get('published') === 'on' ? 'published' : 'draft',
        front: fieldFile(data, 'front'),
        back: fieldFile(data, 'back'),
        model: fieldFile(data, 'model'),
      };

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
        throw new Error(
          'The URL slug can use lowercase letters, numbers and hyphens only.',
        );
      }
      if (!Number.isInteger(input.price) || input.price < 1) {
        throw new Error('Enter a valid whole-number price.');
      }

      const created = await adminCreateProduct(input);
      onCreated(created);
      form.reset();
      setMessage(
        `${created.name} was ${created.status === 'published' ? 'published' : 'saved as a draft'}.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the product.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-products-layout">
      <section className="admin-product-form-panel">
        <div className="admin-section-title">
          <span>
            <PackagePlus size={18} /> NEW PRODUCT
          </span>
          <h2>Build the next drop.</h2>
          <p>
            Add the customer-facing details and three finished product images.
            Save privately as a draft or publish immediately.
          </p>
        </div>

        {message && (
          <output className="system-notice success">{message}</output>
        )}
        {error && (
          <div className="system-notice error" role="alert">
            {error}
          </div>
        )}

        <form className="admin-product-form" onSubmit={submit}>
          <fieldset>
            <legend>
              <span>01</span> Product identity
            </legend>
            <div className="admin-form-grid">
              <label className="admin-field-wide">
                Product name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="e.g. Built Different"
                />
              </label>
              <label>
                URL slug
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="built-different"
                />
              </label>
              <label>
                Drop number
                <input
                  name="number"
                  required
                  pattern="[0-9]{2,3}"
                  defaultValue={nextNumber}
                />
              </label>
              <label>
                Price (MAD)
                <input
                  name="price"
                  type="number"
                  required
                  min="1"
                  max="100000"
                  step="1"
                  placeholder="120"
                />
              </label>
              <label>
                Garment color
                <input
                  name="color"
                  required
                  maxLength={40}
                  placeholder="Black"
                />
              </label>
              <label>
                Display order
                <input
                  name="sort_order"
                  type="number"
                  required
                  min="0"
                  max="10000"
                  step="1"
                  defaultValue={products.length * 10 + 10}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>02</span> Story & availability
            </legend>
            <label>
              Product description
              <textarea
                name="description"
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                placeholder="Describe the garment, artwork and the idea behind it."
              />
            </label>
            <label>
              Print details
              <input
                name="print_details"
                required
                maxLength={100}
                defaultValue="Front & back printed"
              />
            </label>
            <div className="admin-size-picker">
              <span>Available sizes</span>
              <div>
                {allSizes.map((size) => (
                  <label key={size}>
                    <input
                      type="checkbox"
                      name="sizes"
                      value={size}
                      defaultChecked
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>03</span> Product photography
            </legend>
            <p className="admin-field-help">
              JPG, PNG or WebP. Maximum 6 MB each. Use clean, high-resolution
              images with consistent lighting.
            </p>
            <div className="admin-upload-grid">
              {[
                ['front', 'Front view', 'Main front artwork'],
                ['back', 'Back view', 'Main back artwork'],
                ['model', 'Collection card', 'Worn or campaign image'],
              ].map(([name, title, hint]) => (
                <label className="admin-upload" key={name}>
                  <ImagePlus size={22} />
                  <strong>{title}</strong>
                  <span>{hint}</span>
                  <input
                    aria-label={`${title} image`}
                    name={name}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="admin-publish-row">
            <label className="admin-publish-toggle">
              <input
                aria-label="Publish this product now"
                type="checkbox"
                name="published"
              />
              <span>
                <strong>Publish now</strong>
                <small>Otherwise it stays hidden as a draft.</small>
              </span>
            </label>
            <button className="primary" type="submit" disabled={busy}>
              {busy ? 'Uploading & saving…' : 'Create product'}{' '}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </section>

      <aside className="admin-catalog-panel">
        <div className="admin-section-title compact">
          <span>CATALOG · {products.length} PRODUCTS</span>
          <h2>Current lineup.</h2>
        </div>
        <div className="admin-product-list">
          {products.map((product) => (
            <article key={product.id}>
              <Image
                src={product.model}
                alt=""
                width={66}
                height={76}
                unoptimized
              />
              <div>
                <small>
                  DROP {product.number} · {product.status}
                </small>
                <strong>{product.name}</strong>
                <span>
                  {product.color} · {product.sizes.join(' / ')}
                </span>
              </div>
              <b>{product.price} MAD</b>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
