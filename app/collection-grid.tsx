import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { products } from './catalog';

const cardAngles = [0, 1, 0] as const;

export default function CollectionGrid() {
  return (
    <div className="product-grid commerce-grid">
      {products.map((p, productIndex) => (
        <Link
          className="commerce-card"
          href={`/collection/${p.slug}`}
          key={p.slug}
          aria-label={`Explore ${p.name}, ${p.price} MAD`}
        >
          <span className="commerce-card-media">
            <span className="commerce-card-badge">DROP 001 · {p.number}</span>
            <span
              className={`commerce-card-wearer media-row-${productIndex} media-angle-${cardAngles[productIndex]}`}
              role="img"
              aria-label={`Model wearing ${p.name}`}
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
