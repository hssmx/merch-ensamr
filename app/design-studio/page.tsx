import {
  ArrowRight,
  Check,
  FileImage,
  MessageCircle,
  Shirt,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { shopConfig } from '../shop-config';
import './custom-print.css';

export const metadata = {
  title: 'Print your design | MERCH ENSAM RABAT',
  description:
    'Send your artwork to MERCH ENSAM RABAT and have it printed on a T-shirt.',
};

const message = encodeURIComponent(
  'Hello! I would like to print my own design on a T-shirt.',
);

export default function CustomPrintPage() {
  return (
    <main id="main">
      <section className="bloxic-page-title">
        <div>
          <h1>Print your design</h1>
          <nav aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <strong>Custom printing</strong>
          </nav>
        </div>
      </section>
      <section className="print-your-design">
        <div className="print-visual">
          <Image
            src="/blank-tee.webp"
            alt="Blank T-shirt ready for a custom design"
            width="1254"
            height="1254"
          />
          <span className="print-visual-note">YOUR IDEA GOES HERE</span>
        </div>
        <div className="print-copy">
          <span className="eyebrow">CUSTOM PRINTING</span>
          <h2>
            Your design.
            <br />
            We’ll print it.
          </h2>
          <p className="print-intro">
            Already have artwork you love? Send it to our team with your T-shirt
            choices. We’ll review the design, confirm the placement and give you
            the final price before printing.
          </p>
          <div className="print-needs" aria-label="What to send us">
            <div>
              <FileImage aria-hidden="true" />
              <span>
                <strong>Your artwork</strong>The clearest file you have
              </span>
            </div>
            <div>
              <Shirt aria-hidden="true" />
              <span>
                <strong>Your preferences</strong>Color, placement and T-shirt
                size
              </span>
            </div>
            <div>
              <Check aria-hidden="true" />
              <span>
                <strong>Our confirmation</strong>Feasibility, final details and
                price
              </span>
            </div>
          </div>
          {shopConfig.whatsappContacts.length ? (
            <div className="print-contacts">
              {shopConfig.whatsappContacts.map((contact) => (
                <a
                  className="primary"
                  href={`https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${message}`}
                  key={contact.phone}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={18} /> Message {contact.name}{' '}
                  <ArrowRight size={18} />
                </a>
              ))}
            </div>
          ) : (
            <p className="print-contact-note">
              <MessageCircle aria-hidden="true" />
              WhatsApp ordering details will be available before launch.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
