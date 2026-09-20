import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { pageMetadata } from '../site-metadata';

export const metadata = pageMetadata({
  title: 'Legal, Privacy & Store Policies | MERCH ENSAM-R',
  description: 'Terms of sale, privacy, cookies, returns, delivery and account-rights information for MERCH ENSAM-R.',
  path: '/legal',
});

const effective = '20 September 2026';

export default function LegalPage() {
  return (
    <main id="main" className="legal-page">
      <header className="legal-hero">
        <Link href="/" className="page-back"><ArrowLeft size={16} /> Home</Link>
        <span>LEGAL · PRIVACY · STORE RULES</span>
        <h1>Store policies.</h1>
        <p>
          Effective {effective}. These terms describe how MERCH ENSAM-R currently operates.
          Mandatory consumer and data-protection rights under Moroccan law are not limited by this page.
        </p>
      </header>

      <nav className="legal-index" aria-label="Policy sections">
        <a href="#operator">Operator</a>
        <a href="#terms">Terms of sale</a>
        <a href="#returns">Returns</a>
        <a href="#delivery">Delivery</a>
        <a href="#privacy">Privacy</a>
        <a href="#cookies">Cookies</a>
        <a href="#accounts">Account rights</a>
      </nav>

      <div className="legal-content">
        <section id="operator">
          <span>01</span>
          <div>
            <h2>Operator & contact</h2>
            <p>MERCH ENSAM-R is presented on this website as a student-led merchandising initiative created by the Media Committee for ENSAM Rabat, Rabat, Morocco.</p>
            <p>Customer support, complaints, sizing questions and order follow-up are available through the <Link href="/contact">Contact page</Link> and the published team WhatsApp numbers. Instagram: <a href="https://www.instagram.com/merch.ensamr/" target="_blank" rel="noreferrer">@merch.ensamr</a>.</p>
          </div>
        </section>

        <section id="terms">
          <span>02</span>
          <div>
            <h2>Terms of sale</h2>
            <p>Product descriptions, available sizes and prices are shown in Moroccan dirhams (MAD). Placing an order sends a purchase request to the team; it is not treated as finally confirmed until the team verifies availability and payment.</p>
            <p>After checkout, the team contacts the customer to confirm collection or delivery and proposes the available payment method, currently cash or bank transfer. Payment is required before an order can be marked Confirmed.</p>
            <p>We may correct obvious pricing, stock or description errors before confirmation. If a product becomes unavailable after payment, the customer will be informed and any amount due back will be handled in accordance with applicable consumer law.</p>
          </div>
        </section>

        <section id="returns">
          <span>03</span>
          <div>
            <h2>Withdrawal, returns & refunds</h2>
            <p>For distance sales, Moroccan Law 31-08 provides a withdrawal period that generally runs for seven days from receipt of goods, subject to statutory exceptions. Where a valid withdrawal applies, the customer should contact the team promptly and keep proof of the request.</p>
            <p>Goods made to the customer’s specifications or clearly personalized may fall within the statutory exception to the withdrawal right. This is especially relevant to custom-print or made-for-you work.</p>
            <p>Nothing here removes rights relating to defective, damaged, incorrectly supplied or non-conforming goods. Contact the team with the order number and photos where useful so the issue can be reviewed.</p>
          </div>
        </section>

        <section id="delivery">
          <span>04</span>
          <div>
            <h2>Collection & delivery</h2>
            <p>Collection details are confirmed by the team. For delivery orders, the delivery area, timing and any delivery fee are confirmed before final order confirmation. The checkout subtotal does not automatically include a delivery fee.</p>
            <p>Customers should provide accurate contact and delivery information and respond to the confirmation call so fulfilment can be arranged.</p>
          </div>
        </section>

        <section id="privacy">
          <span>05</span>
          <div>
            <h2>Privacy policy</h2>
            <p>We process information needed to operate the store, including account email and name, order contact details, delivery address where applicable, order contents, payment-status information, customer notes, and technical browser storage used for sessions and cart continuity.</p>
            <p>We use this information to create and manage accounts, process and track orders, contact customers, prevent abuse, resolve disputes, maintain receipts and comply with legal obligations. We do not sell customer data.</p>
            <p>Store data is hosted using service providers including Supabase and Vercel. Product media may be delivered through external content-delivery infrastructure. Opening WhatsApp or Instagram leaves this website and is then subject to those services’ own privacy practices.</p>
            <p>Personal data is retained only for as long as needed for the relevant purpose and any applicable accounting, dispute, fraud-prevention or legal retention requirement. Requests for access, correction, objection or deletion can be made through the account settings or Contact page. You may also contact Morocco’s CNDP regarding data-protection rights.</p>
          </div>
        </section>

        <section id="cookies">
          <span>06</span>
          <div>
            <h2>Cookie & storage policy</h2>
            <p>This storefront currently uses necessary browser storage to keep the cart, authentication session, guest-order claim information and cookie preference working. A necessary cookie records that the cookie notice has been acknowledged.</p>
            <p>Advertising and behavioural analytics cookies are not currently enabled. If optional tracking or analytics cookies are introduced later, this notice and consent controls should be updated before those cookies are placed.</p>
          </div>
        </section>

        <section id="accounts">
          <span>07</span>
          <div>
            <h2>Accounts, security & deletion</h2>
            <p>Accounts are optional for checkout but enable tracking and receipt history. Customers are responsible for keeping passwords confidential and should use the password-reset flow if access is lost.</p>
            <p>A signed-in customer can request account deletion from Account settings. Deleting an account does not necessarily mean every transaction record can be erased immediately; records may be retained where necessary for orders, disputes, fraud prevention, accounting or other legal obligations.</p>
          </div>
        </section>

        <section id="custom-work">
          <span>08</span>
          <div>
            <h2>Custom designs & intellectual property</h2>
            <p>When submitting artwork, logos, names or other material for custom work, the customer is responsible for having the rights or permission needed to use that material. We may refuse work that appears unlawful, infringing or unsuitable for production.</p>
          </div>
        </section>

        <section id="changes">
          <span>09</span>
          <div>
            <h2>Changes & complaints</h2>
            <p>Policies may be updated when store practices or legal requirements change. The effective date above identifies the current version. For a complaint about an order or these policies, contact the team through the <Link href="/contact">Contact page</Link>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
