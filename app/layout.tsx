import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from './site-shell';
import './globals.css';
import './storefront.css';
import './bloxic-port.css';
import './premium.css';
import './mobile.css';
import './mobile-v2.css';
import './reviews.css';
import './home-compact.css';
import './storefront-refine.css';
export const metadata: Metadata = {
  title: 'The ENSAM Merch Shop | Original T-shirts & Custom Designs',
  icons: { icon: '/favicon.svg' },
  description:
    'Discover ENSAM Rabat merch, print your own artwork, or commission a unique design. Orders and payment through WhatsApp.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
