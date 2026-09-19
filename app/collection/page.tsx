import Link from 'next/link';
import CollectionGrid from '../collection-grid';
import { pageMetadata } from '../site-metadata';
export const metadata = pageMetadata({
  title: 'T-shirts | MERCH ENSAM-R',
  description:
    'Shop the opening ENSAM Rabat collection: MIND IN MOTION, Be creART(et métiers)ive and Think Beyond Limits.',
  path: '/collection',
});
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
