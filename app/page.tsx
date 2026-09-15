import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  PenTool,
  Shirt,
  MessageCircle,
} from 'lucide-react';
import FeaturedCollection from './featured-collection';
import CollectionGrid from './collection-grid';
import { FeaturedReview } from './reviews-preview';

export default function Home() {
  return (
    <main id="main">
      <FeaturedCollection />
      <section className="service-strip">
        <div>
          <Shirt />
          <h3>Original ENSAMR releases</h3>
          <p>Created for our community, with more on the way.</p>
        </div>
        <div>
          <PenTool />
          <h3>Print your artwork</h3>
          <p>Send your design and preferred placement.</p>
        </div>
        <div>
          <MessageCircle />
          <h3>Order directly</h3>
          <p>Confirmation and payment through WhatsApp.</p>
        </div>
        <div>
          <BadgeCheck />
          <h3>Made with care</h3>
          <p>Every detail is reviewed before an order is confirmed.</p>
        </div>
      </section>
      <section className="shop-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE FIRST ENSAMR DROP</span>
            <h2>The original collection</h2>
          </div>
          <Link className="text-link" href="/collection">
            Shop all T-shirts <ArrowRight size={17} />
          </Link>
        </div>
        <CollectionGrid />
      </section>
      <section className="brand-section" aria-label="Our values">
        <div className="brand-marquee">
          <span>ENSAM RABAT</span>
          <strong> FIRST EDITION</strong>
          <span className="committee-credit">MEDIA COMMITTEE</span>
          <span aria-hidden="true">ENSAM RABAT</span>
          <strong aria-hidden="true"> FIRST EDITION</strong>
          <span className="committee-credit" aria-hidden="true">
            MEDIA COMMITTEE
          </span>
        </div>
      </section>
      <section className="lookbook-section" aria-label="Collection lookbook">
        <div className="lookbook-rail">
          <Link
            className="lookbook-shot mind"
            href="/collection/mind-in-motion"
          >
            <Image
              src="/lookbook/mind-in-motion-models.webp"
              alt="Two models wearing the front and back of the MIND IN MOTION T-shirt"
              width="1536"
              height="1024"
            />
            <span>
              <small>01 / BLACK</small>
              <strong>MIND IN MOTION</strong>
            </span>
          </Link>
          <Link
            className="lookbook-shot creative"
            href="/collection/be-creative"
          >
            <Image
              src="/lookbook/be-creative-models.webp"
              alt="Two models wearing the front and back of the Be creART(et métiers)ive T-shirt"
              width="1024"
              height="1536"
              loading="lazy"
            />
            <span>
              <small>02 / BLACK</small>
              <strong>BE CREATIVE</strong>
            </span>
          </Link>
          <Link
            className="lookbook-shot limits"
            href="/collection/think-beyond-limits"
          >
            <Image
              src="/lookbook/think-beyond-limits-models.webp"
              alt="Two models wearing the front and back of the Think Beyond Limits T-shirt"
              width="1024"
              height="1536"
              loading="lazy"
            />
            <span>
              <small>03 / WHITE</small>
              <strong>THINK BEYOND LIMITS</strong>
            </span>
          </Link>
        </div>
      </section>

      <section className="home-review-section" id="reviews">
        <div className="home-review-copy">
          <span className="eyebrow">REVIEWS · EDITION 001</span>
          <h2>One note from the archive.</h2>
          <p>
            The homepage now keeps this intentionally simple: one rotating
            preview review, with the full archive on its own page.
          </p>
          <Link className="home-review-link" href="/reviews">
            See all reviews <ArrowRight size={17} />
          </Link>
        </div>
        <FeaturedReview />
      </section>

      <section className="custom-service-suite">
        <div className="service-suite-art">
          <span className="service-suite-code">CUSTOM / 001</span>
          <Image
            src="/blank-tee.webp"
            alt="Blank T-shirt ready for custom artwork"
            width="1254"
            height="1254"
          />
          <span className="service-suite-word" aria-hidden="true">
            YOURS
          </span>
        </div>
        <div className="service-suite-options">
          <header>
            <span className="eyebrow">ONE T-SHIRT · TWO SERVICES</span>
            <h2>Start with what you have.</h2>
          </header>
          <article>
            <span className="service-step">01</span>
            <div>
              <small>YOU HAVE THE ARTWORK</small>
              <h3>We print your design.</h3>
              <p>
                Send your artwork, placement, color and size. We’ll confirm the
                details and final price before printing.
              </p>
              <Link href="/design-studio">
                Printing details <ArrowRight size={17} />
              </Link>
            </div>
          </article>
          <article>
            <span className="service-step">02</span>
            <div>
              <small>YOU HAVE THE IDEA</small>
              <h3>We create the design with you.</h3>
              <p>
                Share your direction with our creative team. A separate design
                fee is agreed before the work begins.
              </p>
              <Link href="/made-for-you">
                Design service <ArrowRight size={17} />
              </Link>
            </div>
          </article>
        </div>
      </section>
      <section className="faq-section" id="faq">
        <div className="faq-intro">
          <span className="eyebrow">ORDER NOTES</span>
          <h2>Before you order.</h2>
          <p>The details customers usually need, kept in one place.</p>
        </div>
        <div className="faq-list">
          <details>
            <summary>How will I place an order?</summary>
            <p>
              Open a T-shirt, choose your size and quantity, then review the
              prepared order, then send it directly to one of our available
              WhatsApp contacts.
            </p>
          </details>
          <details>
            <summary>How do payment and delivery work?</summary>
            <p>
              Payment instructions, delivery or collection arrangements, and any
              delivery fee are confirmed directly with the team on WhatsApp.
            </p>
          </details>
          <details>
            <summary>Can you print artwork I already have?</summary>
            <p>
              Yes. Send the clearest version of your artwork with your preferred
              T-shirt color, size and print placement. We’ll confirm feasibility
              and the final price before printing.
            </p>
          </details>
          <details>
            <summary>Can your team create the design for me?</summary>
            <p>
              Yes. Share your idea, references and preferred style. We’ll agree
              on the brief and the additional design fee before creative work
              starts.
            </p>
          </details>
        </div>
      </section>
      <section className="home-story-contact" aria-label="About and contact">
        <article className="home-story-card">
          <span>BEHIND THE DROP</span>
          <p className="home-card-word" aria-hidden="true">
            OURS
          </p>
          <h2>Born inside ENSAM Rabat.</h2>
          <p>
            A student-led collection by the Media Committee, shaped around the
            ideas, energy and identity of our community.
          </p>
          <Link href="/about">
            Meet the project <ArrowRight size={17} />
          </Link>
        </article>
        <article className="home-contact-card">
          <span>ORDER / ASK / CREATE</span>
          <p className="home-card-word" aria-hidden="true">
            TALK
          </p>
          <h2>Talk directly with us.</h2>
          <p>
            Reach our team on WhatsApp for orders, product questions, custom
            printing and design enquiries.
          </p>
          <Link href="/contact">
            Choose a contact <ArrowRight size={17} />
          </Link>
        </article>
      </section>
      <section className="instagram-band">
        <div>
          <span>Follow the next drop</span>
          <h2>@merch.ensamr</h2>
        </div>
        <a
          href="https://www.instagram.com/merch.ensamr/"
          target="_blank"
          rel="noreferrer"
        >
          Visit Instagram <ArrowRight size={18} />
        </a>
      </section>
    </main>
  );
}
