import type { Metadata } from 'next';
import Link from 'next/link';
import CollectionGrid from '../collection-grid';
export const metadata: Metadata = {
  title: 'T-shirts | The ENSAM Merch Shop',
  description:
    'Shop the opening ENSAM Rabat collection. MIND IN MOTION: 135 MAD. Be creART(et métiers)ive and Think Beyond Limits: 120 MAD.',
};
export default function Collection() {
  return (
    <main id="main">
      <section className="catalog-heading">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Collection</span>
        </nav>
        <div>
          <span className="eyebrow">THE ORIGINAL COLLECTION</span>
          <h1>The first ENSAMR collection.</h1>
          <p>The opening designs, printed on the front and back.</p>
        </div>
      </section>
      <section className="shop-section catalog-section">
        <div className="catalog-bar">
          <h2>
            All T-shirts <span>3</span>
          </h2>
          <span>Front & back printed · New releases will follow</span>
        </div>
        <CollectionGrid />
        <div className="next-drop">
          <span>There’s more on the drawing board.</span>
          <a
            href="https://www.instagram.com/merch.ensamr/"
            target="_blank"
            rel="noreferrer"
          >
            Follow the next drop on Instagram ↗
          </a>
        </div>
      </section>
    </main>
  );
}
