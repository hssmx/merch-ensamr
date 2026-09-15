import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { products } from './catalog';

export default function CollectionGrid() {
  return (
    <div className="product-grid dossier-grid">
      {products.map((p) => (
        <Link
          className="dossier-card"
          href={`/collection/${p.slug}`}
          key={p.slug}
          aria-label={`Explore ${p.name}, ${p.price} MAD`}
        >
          <span className="dossier-visual">
            <span className="dossier-number" aria-hidden="true">
              {p.number}
            </span>
            <Image
              className="dossier-back"
              src={p.back}
              alt={`${p.name}, back view`}
              width="1500"
              height="1500"
              loading="lazy"
            />
            <span className="dossier-front-proof">
              <Image
                className="dossier-front"
                src={p.front}
                alt={`${p.name}, front view`}
                width="1500"
                height="1500"
                loading="lazy"
              />
              <span>FRONT PROOF / 02</span>
            </span>
            <span className="dossier-side dossier-side-back">
              BACK PRINT / 01
            </span>
            <span className="dossier-open" aria-hidden="true">
              <ArrowUpRight />
            </span>
          </span>
          <span className="dossier-meta">
            <span>
              <small>ENSAM ORIGINAL · DROP 001</small>
              <strong>{p.name}</strong>
            </span>
            <span className="dossier-spec">
              <small>{p.color} · FRONT & BACK PRINT</small>
              <strong>{p.price} MAD</strong>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
