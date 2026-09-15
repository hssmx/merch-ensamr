'use client';

import { useEffect, useState } from 'react';

const previewReviews = [
  ['MIND IN MOTION', 'The artwork feels bold without losing the clean black-shirt look.'],
  ['THINK BEYOND LIMITS', 'The deep red print gives the white T-shirt a strong identity.'],
  ['BE CREATIVE', 'The front mark is subtle and the back artwork carries the whole piece.'],
  ['MIND IN MOTION', 'A strong balance between a quiet front and a detailed statement back.'],
  ['BE CREATIVE', 'The red, white and black palette feels connected to ENSAM without looking basic.'],
  ['THINK BEYOND LIMITS', 'The oversized lettering makes this feel like a real graphic tee.'],
  ['MIND IN MOTION', 'The cream and violet details stand out beautifully against black.'],
  ['BE CREATIVE', 'Expressive, playful and still easy to style with everyday clothes.'],
  ['THINK BEYOND LIMITS', 'A clean front with a back print that gets noticed immediately.'],
  ['MIND IN MOTION', 'The technical visual language fits the engineering spirit perfectly.'],
  ['BE CREATIVE', 'The typography has energy and the small ENSAM front print keeps it wearable.'],
  ['THINK BEYOND LIMITS', 'Simple colors, confident scale and a message that reads instantly.'],
  ['MIND IN MOTION', 'It looks considered from every angle, especially the back composition.'],
  ['BE CREATIVE', 'A distinctive design that feels made for the creative side of the school.'],
  ['THINK BEYOND LIMITS', 'The contrast is sharp and the design has a strong campus identity.'],
  ['MIND IN MOTION', 'Detailed enough to explore up close and strong enough to read from a distance.'],
  ['BE CREATIVE', 'The asymmetric lettering gives the shirt a memorable personality.'],
  ['THINK BEYOND LIMITS', 'The design feels optimistic, direct and easy to wear.'],
  ['MIND IN MOTION', 'A polished first-release piece that does not feel like typical school merch.'],
  ['THE COLLECTION', 'Each piece has its own voice while still belonging to the same label.'],
] as const;

type ReviewCardProps = {
  design: string;
  text: string;
  index: number;
  featured?: boolean;
};

function PreviewReviewCard({ design, text, index, featured = false }: ReviewCardProps) {
  return (
    <article className={featured ? 'preview-review-card featured' : 'preview-review-card'}>
      <span>{String(index + 1).padStart(2, '0')} / PREVIEW</span>
      <p>“{text}”</p>
      <small>{design} · NOT YET VERIFIED</small>
    </article>
  );
}

export function FeaturedReview() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * previewReviews.length));
  }, []);

  const [design, text] = previewReviews[index];

  return (
    <PreviewReviewCard
      design={design}
      text={text}
      index={index}
      featured
    />
  );
}

export function ReviewsArchive() {
  return (
    <div className="reviews-page-grid">
      {previewReviews.map(([design, text], index) => (
        <PreviewReviewCard
          key={`${design}-${index}`}
          design={design}
          text={text}
          index={index}
        />
      ))}
    </div>
  );
}
