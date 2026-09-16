'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { products } from './catalog';

const heroPairs = [
  [
    {
      label: 'Front',
      src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/5dc29100-1984-4536-835b-777648d6138d.png',
    },
    {
      label: 'Back',
      src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/44c838ca-bc37-4a19-a6ed-b9aba00dab36.png',
    },
  ],
  [
    {
      label: 'Front',
      src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/dd029bf6-745e-42b0-8d68-2133c157e1ab.png',
    },
    {
      label: 'Back',
      src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/8e0860b6-1ff1-4d4d-9ffa-19e06e7e7cf8.png',
    },
  ],
  [
    {
      label: 'Front',
      src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/04fa18a1-de68-4574-90be-618d8982b033.png',
    },
    {
      label: 'Back',
      src: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/ef319207-2e14-412e-85e2-d147abb2e574.png',
    },
  ],
] as const;

export default function FeaturedCollection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % products.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const p = products[index];
  const heroPair = heroPairs[index];

  return (
    <section
      className={`launch-hero hero-${p.slug}`}
      data-header-theme="dark"
      aria-label="Featured T-shirts"
      aria-roledescription="carousel"
    >
      <div className="launch-copy">
        <div className="launch-kicker">
          <span>ENSAM RABAT</span>
          <span>DROP 001 / 2026</span>
        </div>
        <p className="launch-edition">THE FIRST EDITION</p>
        <h1>
          <span>ENGINEERED</span>
          <span>TO BE WORN.</span>
        </h1>
        <p className="launch-intro">
          Original T-shirts created by the ENSAM Rabat community. Designed here.
          Worn everywhere, with new releases already in motion.
        </p>
        <div className="launch-actions">
          <Link href="/collection">
            Explore the collection <ArrowRight size={18} />
          </Link>
          <Link href="/about">Our story</Link>
        </div>
        <div className="launch-stats" aria-label="Collection details">
          <span><strong>DROP 001</strong> the opening release</span>
          <span><strong>MORE</strong> drops in progress</span>
          <span><strong>120</strong> MAD from</span>
        </div>
      </div>

      <div className="launch-visual campaign-visual">
        <div
          key={p.slug}
          className={`campaign-triptych media-row-${index}`}
          aria-label={`Two worn views of ${p.name}`}
        >
          <div className="campaign-duo">
            {heroPair.map((shot, shotIndex) => (
              <img
                key={shot.label}
                className={`campaign-model campaign-model-${shotIndex + 1}`}
                src={shot.src}
                alt={`${p.name}, ${shot.label.toLowerCase()} worn view`}
                loading="eager"
                decoding="async"
              />
            ))}
          </div>
        </div>
        <div className="campaign-shade" aria-hidden="true" />
        <div className="launch-product">
          <div className="launch-product-action">
            <span>FEATURED T-SHIRT</span>
            <div className="launch-product-buy">
              <strong>{p.price} MAD</strong>
              <Link href={`/collection/${p.slug}`} aria-label={`View ${p.name}`}>
                <span>View</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <h2>{p.name}</h2>
        </div>
      </div>

      <i key={p.slug} className="launch-timer" aria-hidden="true" />
    </section>
  );
}
