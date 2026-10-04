import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { pageMetadata } from '../site-metadata';

export const metadata = pageMetadata({
  title: 'Terms',
  description: 'Ordering and account terms for MERCH ENSAM-R.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <main id="main" className="legal-page">
      <header>
        <Link href="/" className="page-back"><ArrowLeft size={16} /> Home</Link>
        <span>TERMS · LAST UPDATED 4 OCTOBER 2026</span>
        <h1>Clear terms for a manually confirmed order.</h1>
        <p>Submitting an order records your request. The order becomes confirmed only after our team verifies availability and the agreed payment.</p>
      </header>
      <div className="legal-copy">
        <section><h2>Eligibility</h2><p>Accounts are for people aged 16 or older. A younger customer should ask a parent or guardian to place the order.</p></section>
        <section><h2>Orders and pricing</h2><p>Prices are shown in Moroccan dirhams. Product availability, fulfilment timing and any delivery fee are confirmed directly with our team before the order is treated as confirmed.</p></section>
        <section><h2>Payment</h2><p>The website does not process online payments. Payment method and instructions are agreed through an official contact listed on our contact page. Never send card credentials or passwords through WhatsApp.</p></section>
        <section><h2>Custom printing</h2><p>You must own or have permission to use artwork you ask us to print. We may refuse artwork that appears unlawful, abusive or likely to infringe another person’s rights.</p></section>
        <section><h2>Product appearance</h2><p>Screen colours and mockups can differ slightly from a finished garment. We will resolve material defects or an incorrect item directly with the customer.</p></section>
        <section><h2>Accounts</h2><p>Keep your password private and contact us if you believe your account has been accessed without permission. Do not attempt to access another customer’s order or the administration system.</p></section>
        <section><h2>Contact</h2><p>Questions about an order or these terms can be sent through the <Link href="/contact">contact page</Link>.</p></section>
      </div>
    </main>
  );
}
