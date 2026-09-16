import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { products } from './catalog';

const cardAngles = [0, 1, 0] as const;
const cardImages: Record<string, string> = {
  'mind-in-motion':
    'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/66988455-2a2e-4193-bb04-1c03f067b817.png',
  'be-creative':
    'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/57215826-a584-4e0b-aa8b-9de69d8d68d9.png',
};

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
            {cardImages[p.slug] ? (
              <img
                src={cardImages[p.slug]}
                alt={`Model wearing ${p.name}`}
                loading="lazy"
                decoding="async"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: p.slug === 'be-creative' ? 'center 28%' : 'center 27%',
                  padding: 0,
                  transform: p.slug === 'be-creative' ? 'scale(1.03)' : 'scale(1.06)',
                  transformOrigin: 'center 35%',
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
