'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { MoveHorizontal } from 'lucide-react';
import type { Product } from './catalog';

const views = [
  { key: 'campaign', label: 'Campaign', position: '50% 50%' },
  { key: 'front', label: 'Front worn', position: '26% 50%' },
  { key: 'back', label: 'Back worn', position: '74% 50%' },
] as const;

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

  function go(n: number) {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: n * el.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return (
    <div className={`photo-reel wear-reel ${hoverTurn ? 'hover-turn' : ''}`}>
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
        {views.map((view, viewIndex) => (
          <div className={`reel-frame wear-frame wear-${view.key}`} key={view.key}>
            <Image
              src={p.model}
              fill
              sizes="(max-width: 900px) 100vw, 58vw"
              priority={viewIndex === 0 && !hoverTurn}
              loading={viewIndex === 0 && !hoverTurn ? undefined : 'lazy'}
              draggable={false}
              alt={`${p.name}, ${view.label.toLowerCase()} view`}
              style={{ objectPosition: view.position }}
            />
            <span className="wear-view-label">{view.label}</span>
          </div>
        ))}
      </section>

      <div className="wear-thumbnails" aria-label="Choose product photograph">
        {views.map((view, viewIndex) => (
          <button
            key={view.key}
            type="button"
            className={index === viewIndex ? 'active' : ''}
            onClick={() => go(viewIndex)}
            aria-label={`Show ${view.label.toLowerCase()} of ${p.name}`}
            aria-current={index === viewIndex ? 'true' : undefined}
          >
            <span className={`wear-thumb-image wear-${view.key}`}>
              <Image
                src={p.model}
                fill
                sizes="110px"
                alt=""
                aria-hidden="true"
                style={{ objectPosition: view.position }}
              />
            </span>
            <small>{view.label}</small>
          </button>
        ))}
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
