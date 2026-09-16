import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { products } from './catalog';

const cardAngles = [0, 1, 0] as const;
const mindInMotionCardImage =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/66988455-2a2e-4193-bb04-1c03f067b817.png';

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
            {p.slug === 'mind-in-motion' ? (
              <img
                src={mindInMotionCardImage}
                alt={`Model wearing ${p.name}`}
                loading="lazy"
                decoding="async"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  padding: '10px 8px 0',
                }}
              />
            ) : (
              <span
                className={`commerce-card-wearer media-row-${productIndex} media-angle-${cardAngles[productIndex]}`}
                role="img"
                aria-label={`Model wearing ${p.name}`}
              />
            )}
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
