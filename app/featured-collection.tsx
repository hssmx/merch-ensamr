'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { products } from './catalog';
export default function FeaturedCollection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % products.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [paused]);
  const p = products[index];
  return (
    <section
      className={`launch-hero hero-${p.slug}`}
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
          <span>
            <strong>DROP 001</strong> the opening release
          </span>
          <span>
            <strong>MORE</strong> drops in progress
          </span>
          <span>
            <strong>120</strong> MAD from
          </span>
        </div>
      </div>
      <div className="launch-visual">
        <span className="launch-ghost" aria-hidden="true">
          0{index + 1}
        </span>
        <Image
          key={p.slug}
          src={p.back}
          width="1500"
          height="1500"
          priority
          alt={`${p.name} back design`}
        />
        <div className="launch-product">
          <span>FEATURED / 0{index + 1}</span>
          <h2>{p.name}</h2>
          <div>
            <strong>{p.price} MAD</strong>
            <Link href={`/collection/${p.slug}`} aria-label={`View ${p.name}`}>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
      <div className="launch-selector" aria-label="Choose featured design">
        {products.map((product, productIndex) => (
          <button
            key={product.slug}
            className={productIndex === index ? 'active' : ''}
            onClick={() => setIndex(productIndex)}
            aria-label={`Show ${product.name}`}
            aria-pressed={productIndex === index}
          >
            <span>0{productIndex + 1}</span>
            {product.name}
          </button>
        ))}
        <button
          className="launch-pause"
          onClick={() => setPaused((value) => !value)}
          aria-label={
            paused ? 'Resume featured T-shirts' : 'Pause featured T-shirts'
          }
          aria-pressed={paused}
        >
          {paused ? <Play /> : <Pause />}
        </button>
      </div>
      <i
        key={p.slug}
        className={`launch-timer ${paused ? 'paused' : ''}`}
        aria-hidden="true"
      />
    </section>
  );
}
