'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { MoveHorizontal, ZoomIn } from 'lucide-react';
import type { Product } from './catalog';
export default function PhotoReel({
  product: p,
  hoverTurn = false,
  onEnlarge,
}: {
  product: Product;
  hoverTurn?: boolean;
  onEnlarge?: (view: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(
    null,
  );
  const suppress = useRef(false);
  const [index, setIndex] = useState(0);
  function go(n: number) {
    const el = track.current;
    if (el)
      el.scrollTo({
        left: n * el.clientWidth,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      });
  }
  return (
    <div
      className={`photo-reel ${hoverTurn ? 'hover-turn' : ''}`}
      onPointerEnter={(e) => {
        if (hoverTurn && e.pointerType === 'mouse') go(1);
      }}
      onPointerLeave={(e) => {
        if (hoverTurn && e.pointerType === 'mouse') go(0);
      }}
    >
      <section
        ref={track}
        className="reel-track"
        aria-roledescription="carousel"
        aria-label={`${p.name} product photographs`}
        onScroll={(e) =>
          setIndex(
            Math.round(
              e.currentTarget.scrollLeft / e.currentTarget.clientWidth,
            ),
          )
        }
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || hoverTurn) return;
          drag.current = {
            x: e.clientX,
            scroll: e.currentTarget.scrollLeft,
            moved: false,
          };
          suppress.current = false;
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const delta = e.clientX - d.x;
          if (Math.abs(delta) > 5) {
            d.moved = true;
            suppress.current = true;
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
              e.currentTarget.scrollLeft > e.currentTarget.clientWidth / 2
                ? 1
                : 0,
            );
        }}
        onPointerCancel={(e) => {
          drag.current = null;
          e.currentTarget.style.scrollSnapType = '';
        }}
      >
        {(['back', 'front'] as const).map((v) => (
          <div
            className="reel-frame"
            key={v}
          >
            <Image
              src={p[v]}
              width="1500"
              height="1500"
              loading={hoverTurn ? 'lazy' : undefined}
              draggable={false}
              alt={`${p.name}, ${v} view`}
            />
          </div>
        ))}
      </section>
      <div className="reel-bottom">
        <span className="reel-hint">
          <MoveHorizontal size={14} />
          <span>
            {hoverTurn
              ? 'Hover to turn · swipe to explore'
              : 'Drag or swipe to explore'}
          </span>
        </span>
        <span className="reel-progress" aria-label={`Photo ${index + 1} of 2`}>
          <button
            type="button"
            className={index === 0 ? 'active' : ''}
            aria-label={`Show back view of ${p.name}`}
            aria-current={index === 0 ? 'true' : undefined}
            onClick={() => go(0)}
          />
          <button
            type="button"
            className={index === 1 ? 'active' : ''}
            aria-label={`Show front view of ${p.name}`}
            aria-current={index === 1 ? 'true' : undefined}
            onClick={() => go(1)}
          />
        </span>
        {onEnlarge && (
          <button
            className="reel-enlarge"
            aria-label="Enlarge product photo"
            onClick={() => onEnlarge(index ? 'front' : 'back')}
          >
            <ZoomIn size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
