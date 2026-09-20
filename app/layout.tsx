import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from './site-shell';
import { CartProvider } from './cart/cart-provider';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  SITE_URL,
} from './site-metadata';
import './globals.css';
import './storefront.css';
import './bloxic-port.css';
import './premium.css';
import './mobile.css';
import './mobile-v2.css';
import './reviews.css';
import './home-compact.css';
import './storefront-refine.css';
import './storefront-final.css';
import './visual-rework.css';
import './final-polish.css';
import './campaign-media.css';
import './hero-panel-polish.css';
import './hero-panel-alignment.css';
import './card-media-polish.css';
import './homepage-refresh.css';
import './service-strip-polish.css';
import './product-page-refresh.css';
import './cart-system.css';
import './commerce-mobile.css';
import './commerce-finish.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'The ENSAM Merch Shop | Original T-shirts & Custom Designs',
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: 'The ENSAM Merch Shop | Original T-shirts & Custom Designs',
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        alt: 'MERCH ENSAM-R',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The ENSAM Merch Shop | Original T-shirts & Custom Designs',
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
