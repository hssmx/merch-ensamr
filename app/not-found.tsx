import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <span className="eyebrow">PAGE NOT FOUND</span>
      <h1>Let’s find your way back.</h1>
      <p>
        The page you’re looking for isn’t here. The collection is a good place
        to start.
      </p>
      <Link className="primary" href="/collection">
        Explore the collection
      </Link>
    </main>
  );
}
