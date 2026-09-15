import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReviewComposer from '../review-composer';
import { ReviewsArchive } from '../reviews-preview';

export const metadata: Metadata = {
  title: 'Reviews | MERCH ENSAM-R',
  description:
    'Browse the MERCH ENSAM-R review archive and submit your own review through WhatsApp.',
};

export default function ReviewsPage() {
  return (
    <main id="main" className="reviews-page">
      <section className="reviews-page-hero">
        <Link className="page-back" href="/">
          <ArrowLeft size={15} /> Back to the shop
        </Link>
        <span>REVIEW ARCHIVE · EDITION 001</span>
        <h1>All reviews.</h1>
        <p>
          These are preview examples for the archive layout, not customer claims.
          They will be replaced by verified reviews as orders are delivered.
        </p>
      </section>

      <section className="reviews-archive-section" aria-label="Review archive">
        <div className="reviews-page-heading">
          <span>THE ARCHIVE</span>
          <h2>Every note, in one place.</h2>
          <p>
            Browse the full preview archive here instead of loading every card on
            the homepage.
          </p>
        </div>
        <ReviewsArchive />
      </section>

      <section className="reviews-submit-section" aria-label="Submit a review">
        <ReviewComposer />
      </section>
    </main>
  );
}
