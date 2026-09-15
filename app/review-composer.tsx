'use client';

import { useMemo, useState } from 'react';
import { Check, MessageCircle } from 'lucide-react';
import { products, whatsappUrl } from './catalog';
import { shopConfig } from './shop-config';

export default function ReviewComposer() {
  const [product, setProduct] = useState(products[0].name);
  const [size, setSize] = useState('M');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [status, setStatus] = useState('');

  const message = useMemo(
    () =>
      `MERCH ENSAMR REVIEW\nDesign: ${product}\nSize: ${size}\nRating: ${rating}/5\nReview: ${review.trim()}`,
    [product, rating, review, size],
  );

  function submitReview(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (review.trim().length < 10) {
      setStatus('Write at least 10 characters so your review is useful.');
      return;
    }
    const destination = whatsappUrl(
      shopConfig.whatsappContacts[0].phone,
      message,
    );
    if (!destination) {
      setStatus('Review submission is temporarily unavailable.');
      return;
    }
    const opened = window.open(destination, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.assign(destination);
    setStatus('WhatsApp opened with your review ready to send.');
  }

  return (
    <div className="review-contribute">
      <div className="review-contribute-intro">
        <span>WORE THE FIRST DROP?</span>
        <h3>Leave your review.</h3>
        <p>
          Tell future buyers about the print, feel and fit. We’ll publish
          verified customer notes in the archive above.
        </p>
      </div>
      <form onSubmit={submitReview}>
        <div className="review-fields">
          <label>
            <span>Design</span>
            <select
              value={product}
              onChange={(event) => setProduct(event.target.value)}
            >
              {products.map((item) => (
                <option key={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Size</span>
            <select
              value={size}
              onChange={(event) => setSize(event.target.value)}
            >
              {['S', 'M', 'L', 'XL', 'XXL'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="review-rating">
          <legend>Rating</legend>
          <div>
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                />
                <span aria-hidden="true">★</span>
                <span className="sr-only">{value} stars</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="review-message">
          <span>Your review</span>
          <textarea
            required
            minLength={10}
            maxLength={600}
            value={review}
            onChange={(event) => {
              setReview(event.target.value);
              setStatus('');
            }}
            placeholder="How did the print, fabric and fit feel?"
          />
        </label>
        <div className="review-actions">
          <button type="submit">
            <MessageCircle size={16} /> Submit review on WhatsApp
          </button>
        </div>
        <output className="review-status" aria-live="polite">
          {status && <Check size={15} aria-hidden="true" />} {status}
        </output>
      </form>
    </div>
  );
}
