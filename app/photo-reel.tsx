'use client';
import { useRef, useState } from 'react';
import { MoveHorizontal } from 'lucide-react';
import type { Product } from './catalog';

const views = [
  { key: 'front', label: 'Front worn', angle: 0 },
  { key: 'three-quarter', label: 'Three-quarter', angle: 1 },
  { key: 'back', label: 'Back worn', angle: 2 },
] as const;

const viewLabelBySlug: Record<string, Partial<Record<(typeof views)[number]['key'], string>>> = {
  'be-creative': {
    'three-quarter': 'Artwork view',
  },
};

const rowBySlug: Record<string, number> = {
  'mind-in-motion': 0,
  'be-creative': 1,
  'think-beyond-limits': 2,
};

const dedicatedWearerImages: Record<
  string,
  Partial<Record<(typeof views)[number]['key'], string>>
> = {
  'mind-in-motion': {
    front:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/5dc29100-1984-4536-835b-777648d6138d.png',
    'three-quarter':
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/66988455-2a2e-4193-bb04-1c03f067b817.png',
    back:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/44c838ca-bc37-4a19-a6ed-b9aba00dab36.png',
  },
  'be-creative': {
    front:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/dd029bf6-745e-42b0-8d68-2133c157e1ab.png',
    'three-quarter':
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/57215826-a584-4e0b-aa8b-9de69d8d68d9.png',
    back:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/8e0860b6-1ff1-4d4d-9ffa-19e06e7e7cf8.png',
  },
};

export default function PhotoReel({
  product: p,
  hoverTurn = false,
}: {
  product: Product;
  hoverTurn?: boolean;
  onEnlarge?: (view: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const [index, setIndex] = useState(0);
  const mediaRow = rowBySlug[p.slug] ?? 0;
  const dedicatedImages = dedicatedWearerImages[p.slug];

  function go(n: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: n * el.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return (
    <div className={`photo-reel wear-reel wear-reel-${p.slug} ${hoverTurn ? 'hover-turn' : ''}`}>
      <section
        ref={track}
        className="reel-track wear-track"
        aria-roledescription="carousel"
        aria-label={`${p.name} worn product photographs`}
        onScroll={(e) =>
          setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
        }
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') return;
          drag.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const delta = e.clientX - d.x;
          if (Math.abs(delta) > 5) {
            d.moved = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            e.currentTarget.style.scrollSnapType = 'none';
            e.currentTarget.scrollLeft = d.scroll - delta;
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (!d) return;
          drag.current = null;
          e.currentTarget.style.scrollSnapType = '';
          if (d.moved) go(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth));
        }}
        onPointerCancel={(e) => {
          drag.current = null;
          e.currentTarget.style.scrollSnapType = '';
        }}
      >
        {views.map((view) => {
          const image = dedicatedImages?.[view.key];
          const label = viewLabelBySlug[p.slug]?.[view.key] ?? view.label;

          return (
            <div
              className={`reel-frame wear-frame wear-view-${view.key} ${image ? 'wear-frame-dedicated' : ''}`}
              key={view.key}
            >
              {image ? (
                <img
                  className="product-wear-photo"
                  src={image}
                  alt={`${p.name}, ${label.toLowerCase()} view`}
                  loading={view.key === 'front' ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : (
                <span
                  className={`product-wear-image media-row-${mediaRow} media-angle-${view.angle}`}
                  role="img"
                  aria-label={`${p.name}, ${label.toLowerCase()} view`}
                />
              )}
              <span className="wear-view-label">{label}</span>
            </div>
          );
        })}
      </section>

      <div className="wear-thumbnails" aria-label="Choose product photograph">
        {views.map((view, viewIndex) => {
          const image = dedicatedImages?.[view.key];
          const label = viewLabelBySlug[p.slug]?.[view.key] ?? view.label;

          return (
            <button
              key={view.key}
              type="button"
              className={index === viewIndex ? 'active' : ''}
              onClick={() => go(viewIndex)}
              aria-label={`Show ${label.toLowerCase()} of ${p.name}`}
              aria-current={index === viewIndex ? 'true' : undefined}
            >
              {image ? (
                <span className="product-wear-thumb product-wear-thumb-photo">
                  <img src={image} alt="" loading="lazy" decoding="async" />
                </span>
              ) : (
                <span
                  className={`product-wear-thumb media-row-${mediaRow} media-angle-${view.angle}`}
                  aria-hidden="true"
                />
              )}
              <small>{label}</small>
            </button>
          );
        })}
      </div>

      <div className="reel-bottom wear-reel-bottom">
        <span className="reel-hint">
          <MoveHorizontal size={14} />
          <span>Swipe or use the thumbnails</span>
        </span>
        <span>{index + 1} / {views.length}</span>
      </div>
    </div>
  );
}
