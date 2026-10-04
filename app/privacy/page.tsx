import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { pageMetadata } from '../site-metadata';

export const metadata = pageMetadata({
  title: 'Privacy',
  description: 'How MERCH ENSAM-R uses account and order information.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main id="main" className="legal-page">
      <header>
        <Link href="/" className="page-back"><ArrowLeft size={16} /> Home</Link>
        <span>PRIVACY · LAST UPDATED 4 OCTOBER 2026</span>
        <h1>Your information stays tied to your order.</h1>
        <p>MERCH ENSAM-R only collects the details needed to run accounts, prepare orders and contact customers about those orders.</p>
      </header>
      <div className="legal-copy">
        <section><h2>What we collect</h2><p>Account name and email; order contact details; delivery address when delivery is selected; ordered products, sizes and quantities; customer notes; and order status history.</p></section>
        <section><h2>Why we use it</h2><p>We use this information to confirm availability, coordinate payment and fulfilment, provide receipts, attach guest orders to an account and answer support requests.</p></section>
        <section><h2>What we do not do</h2><p>We do not sell personal information. We do not run session-replay software, behavioural advertising or marketing-email subscriptions. Payment is arranged manually with our team, so the website does not collect card or bank credentials.</p></section>
        <section><h2>Service providers</h2><p>Account and order records are hosted with Supabase, and the website is hosted with Vercel. These providers process data only to deliver the service.</p></section>
        <section><h2>Retention and security</h2><p>Order records are kept while they are operationally or legally useful. Access to the administration area is restricted to authorised team accounts. Transport encryption, row-level database policies and role checks protect account and order records.</p></section>
        <section><h2>Your choices</h2><p>You may shop as a guest. To ask for access, correction or deletion of account information, contact us through the contact page. Some order records may need to be retained for accounting or dispute handling.</p></section>
        <section><h2>Contact</h2><p>Use the <Link href="/contact">contact page</Link> or message <a href="https://www.instagram.com/merch.ensamr/">@merch.ensamr</a> with a privacy request.</p></section>
      </div>
    </main>
  );
}
