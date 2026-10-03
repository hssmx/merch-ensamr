'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { MoveHorizontal } from 'lucide-react';
import type { Product } from './catalog';

const views = [
  { key: 'front', label: 'Front worn' },
  { key: 'back', label: 'Back worn' },
] as const;

const dedicatedWearerImages: Record<
  string,
  Partial<Record<(typeof views)[number]['key'], string>>
> = {
  'mind-in-motion': {
    front:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/5dc29100-1984-4536-835b-777648d6138d.png',
    back: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/44c838ca-bc37-4a19-a6ed-b9aba00dab36.png',
  },
  'be-creative': {
    front:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/dd029bf6-745e-42b0-8d68-2133c157e1ab.png',
    back: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/8e0860b6-1ff1-4d4d-9ffa-19e06e7e7cf8.png',
  },
  'think-beyond-limits': {
    front:
      'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/04fa18a1-de68-4574-90be-618d8982b033.png',
    back: 'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/ef319207-2e14-412e-85e2-d147abb2e574.png',
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
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(
    null,
  );
  const [index, setIndex] = useState(0);
  const dedicatedImages = dedicatedWearerImages[p.slug] ?? {
    front: p.front,
    back: p.back,
  };

  function go(n: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: n * el.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }

  return (
    <div
      className={`photo-reel wear-reel wear-reel-${p.slug} ${hoverTurn ? 'hover-turn' : ''}`}
    >
      <section
        ref={track}
        className="reel-track wear-track"
        aria-roledescription="carousel"
        aria-label={`${p.name} worn product photographs`}
        onScroll={(e) =>
          setIndex(
            Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
            ),
          )
        }
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') return;
          drag.current = {
            x: e.clientX,
            scroll: e.currentTarget.scrollLeft,
            moved: false,
          };
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
          if (d.moved)
            go(
              Math.round(
                e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
              ),
            );
        }}
        onPointerCancel={(e) => {
          drag.current = null;
          e.currentTarget.style.scrollSnapType = '';
        }}
      >
        {views.map((view) => {
          const image = dedicatedImages?.[view.key] ?? p[view.key];
          const label = view.label;

          return (
            <div
              className={`reel-frame wear-frame wear-view-${view.key} ${image ? 'wear-frame-dedicated' : ''}`}
              key={view.key}
              onPointerMove={(event) => {
                if (event.pointerType !== 'mouse') return;
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                event.currentTarget.style.setProperty('--zoom-x', `${x}%`);
                event.currentTarget.style.setProperty('--zoom-y', `${y}%`);
              }}
              onPointerLeave={(event) => {
                event.currentTarget.style.removeProperty('--zoom-x');
                event.currentTarget.style.removeProperty('--zoom-y');
              }}
            >
              <Image
                className="product-wear-photo"
                src={image}
                alt={`${p.name}, ${label.toLowerCase()} view`}
                width={1200}
                height={1500}
                unoptimized
                loading={view.key === 'front' ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="wear-view-label">{label}</span>
            </div>
          );
        })}
      </section>

      <div className="wear-thumbnails" aria-label="Choose product photograph">
        {views.map((view, viewIndex) => {
          const image = dedicatedImages?.[view.key] ?? p[view.key];
          const label = view.label;

          return (
            <button
              key={view.key}
              type="button"
              className={index === viewIndex ? 'active' : ''}
              onClick={() => go(viewIndex)}
              aria-label={`Show ${label.toLowerCase()} of ${p.name}`}
              aria-current={index === viewIndex ? 'true' : undefined}
            >
              <span className="product-wear-thumb product-wear-thumb-photo">
                <Image
                  src={image}
                  alt=""
                  width={120}
                  height={150}
                  unoptimized
                />
              </span>
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
        <span>
          {index + 1} / {views.length}
        </span>
      </div>
    </div>
  );
}
