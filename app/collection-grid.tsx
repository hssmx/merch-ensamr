import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { products } from './catalog';

export default function CollectionGrid() {
  return (
    <div className="product-grid commerce-grid">
      {products.map((p) => (
        <Link
          className="commerce-card"
          href={`/collection/${p.slug}`}
          key={p.slug}
          aria-label={`Explore ${p.name}, ${p.price} MAD`}
        >
          <span className="commerce-card-media">
            <span className="commerce-card-badge">DROP 001 · {p.number}</span>
            <Image
              className="commerce-card-shirt commerce-card-back"
              src={p.back}
              alt={`${p.name}, back view`}
              width="1500"
              height="1500"
              loading="lazy"
            />
            <Image
              className="commerce-card-shirt commerce-card-front"
              src={p.front}
              alt={`${p.name}, front view`}
              width="1500"
              height="1500"
              loading="lazy"
            />
          </span>

          <span className="commerce-card-body">
            <span className="commerce-card-copy">
              <small>{p.color} · FRONT & BACK PRINT</small>
              <strong>{p.name}</strong>
            </span>
            <span className="commerce-card-price">{p.price} MAD</span>
          </span>

          <span className="commerce-card-cta">
            <span>View T-shirt</span>
            <ArrowRight size={18} />
          </span>
        </Link>
      ))}
    </div>
  );
}
