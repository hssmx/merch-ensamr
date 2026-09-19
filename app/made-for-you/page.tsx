import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Lightbulb, PenTool, MessageCircle } from 'lucide-react';
import { pageMetadata } from '../site-metadata';
export const metadata = pageMetadata({
  title: 'Design services | MERCH ENSAM-R',
  description:
    'Work with the MERCH ENSAM-R team on original artwork for a custom T-shirt, from idea and references to a confirmed final design.',
  path: '/made-for-you',
});
export default function Page() {
  return (
    <main id="main">
      <section className="service-hero">
        <div className="service-art">
          <Image
            src="/collection/be-creative-back.webp"
            width="1500"
            height="1500"
            alt="Be creART(et métiers)ive original design"
          />
        </div>
        <div className="service-copy">
          <span className="eyebrow">THE ENSAM DESIGN SERVICE</span>
          <h1>
            Your idea,
            <br />
            designed with you.
          </h1>
          <p>
            If you know what you want but do not have finished artwork, our team
            can create a unique design for your T-shirt.
          </p>
          <div className="fee-note">
            <PenTool size={20} />
            <p>
              A design fee applies in addition to printing. We agree the scope
              and price with you before starting.
            </p>
          </div>
          <a
            className="primary"
            href="https://www.instagram.com/merch.ensamr/"
            target="_blank"
            rel="noreferrer"
          >
            Meet the team on Instagram <ArrowRight size={18} />
          </a>
          <p className="hint">
            You can also contact us directly through WhatsApp.
          </p>
        </div>
      </section>
      <section className="shop-section design-process">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM IDEA TO ARTWORK</span>
            <h2>How the design service works.</h2>
          </div>
        </div>
        <div className="process-grid">
          <article>
            <Lightbulb />
            <h3>Tell us what you have in mind</h3>
            <p>
              Share your concept, references, preferred colors and where you
              want the design printed.
            </p>
          </article>
          <article>
            <PenTool />
            <h3>Shape it with our team</h3>
            <p>
              Agree the design brief and extra fee with us before the creative
              work begins.
            </p>
          </article>
          <article>
            <MessageCircle />
            <h3>Confirm the final details</h3>
            <p>
              Review your design and arrange printing and payment directly with
              our team.
            </p>
          </article>
        </div>
        <div className="already-designed">
          <div>
            <h3>Already have your artwork?</h3>
            <p>Send it to us and we’ll help prepare it for printing.</p>
          </div>
          <Link className="secondary" href="/design-studio">
            Print your design <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
