import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, MessageCircle } from 'lucide-react';
import { shopConfig } from '../shop-config';
import { whatsappUrl } from '../catalog';
import { pageMetadata } from '../site-metadata';

export const metadata = pageMetadata({
  title: 'Contact the Team | MERCH ENSAM-R',
  description:
    'Contact the MERCH ENSAM-R team directly for sizing help, order questions, delivery support and custom merch requests.',
  path: '/contact',
});

const hello =
  'Hi MERCH ENSAMR! I would like some help with an order or merch enquiry.';

export default function ContactPage() {
  return (
    <main id="main" className="contact-page">
      <section className="contact-hero">
        <Link href="/" className="page-back">
          <ArrowLeft size={16} /> Home
        </Link>
        <span>DIRECT CONTACT · ENSAM RABAT</span>
        <h1>
          <span>Let’s talk</span>
          <span>merch.</span>
        </h1>
        <p>
          Need help with sizing, an existing order or a custom request? Our
          contacts stay available on WhatsApp. Standard T-shirt orders are placed
          through the cart and checkout.
        </p>
      </section>

      <section
        className="contact-directory"
        aria-labelledby="contact-team-title"
      >
        <header>
          <span>THE CONTACT LIST</span>
          <h2 id="contact-team-title">Contact our team.</h2>
        </header>
        <div className="contact-cards">
          {shopConfig.whatsappContacts.map((contact) => {
            const url = whatsappUrl(contact.phone, hello);
            return (
              <article key={contact.phone}>
                <span className="contact-index">AVAILABLE ON WHATSAPP</span>
                <p>{contact.role}</p>
                <h3>{contact.name}</h3>
                <a href={url ?? '#'} target="_blank" rel="noreferrer">
                  <MessageCircle size={19} />
                  <span>{contact.phone}</span>
                  <ArrowRight size={18} />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="contact-guide">
        <div>
          <span>HOW ORDERS WORK</span>
          <h2>Checkout first. We confirm by phone.</h2>
        </div>
        <ol>
          <li>
            <strong>01</strong>
            <span>Choose a design, size and quantity, then add it to your cart.</span>
          </li>
          <li>
            <strong>02</strong>
            <span>Check out as a guest or with an account for tracking.</span>
          </li>
          <li>
            <strong>03</strong>
            <span>Expect a call from our team. Pay by the agreed cash or bank method before final confirmation.</span>
          </li>
        </ol>
      </section>

      <section className="contact-social">
        <div>
          <Camera size={25} />
          <span>NEW DROPS & UPDATES</span>
          <h2>@merch.ensamr</h2>
        </div>
        <a
          href="https://www.instagram.com/merch.ensamr/"
          target="_blank"
          rel="noreferrer"
        >
          Open Instagram <ArrowRight size={18} />
        </a>
      </section>
    </main>
  );
}
