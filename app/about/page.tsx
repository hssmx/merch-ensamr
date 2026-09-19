import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { pageMetadata } from '../site-metadata';

export const metadata = pageMetadata({
  title: 'About | MERCH ENSAM-R',
  description:
    'Meet MERCH ENSAM-R, the student-led label turning ENSAM Rabat culture into original pieces designed to be worn beyond campus.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <main id="main" className="about-page">
      <section className="about-hero">
        <Link href="/" className="page-back">
          <ArrowLeft size={16} /> Home
        </Link>
        <p className="about-kicker">MEDIA COMMITTEE</p>
        <h1>
          <span>Made here.</span>
          <span>
            <em>Made ours.</em>
          </span>
        </h1>
        <div className="about-hero-note">
          <span>EST. AT ENSAM RABAT</span>
          <p>
            MERCH ENSAMR is a student-led label created to turn our shared
            culture into pieces worth wearing beyond campus.
          </p>
        </div>
      </section>

      <section className="about-manifesto">
        <span>OUR POINT OF VIEW</span>
        <p>
          We believe school merch can carry more than a logo. It can hold an
          idea, start a conversation and feel like something you chose to wear.
        </p>
      </section>

      <section className="about-pillars">
        <article>
          <strong>COMMUNITY</strong>
          <h2>By the community</h2>
          <p>
            Created inside ENSAM Rabat, with its students and identity at the
            center.
          </p>
        </article>
        <article>
          <strong>ORIGINAL</strong>
          <h2>Original by design</h2>
          <p>
            Each release starts with a distinct visual thought, developed for
            the garment.
          </p>
        </article>
        <article>
          <strong>PERSONAL</strong>
          <h2>Personal by nature</h2>
          <p>
            Real team members handle every order, custom print and creative
            request.
          </p>
        </article>
      </section>

      <section className="about-edition">
        <div>
          <span>DROP 001</span>
          <h2>The first chapter is already growing.</h2>
          <p>
            MIND IN MOTION, Be creART(et métiers)ive and Think Beyond Limits
            open the collection. New designs and future drops will continue the
            story.
          </p>
        </div>
        <div className="about-edition-links">
          <Link href="/collection">
            See the collection <ArrowRight size={18} />
          </Link>
          <Link href="/contact">
            Talk to the team <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
