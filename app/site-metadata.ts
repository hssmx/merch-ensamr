import type { Metadata } from 'next';

export const SITE_URL = 'https://merch-ensamr.store';
export const SITE_NAME = 'MERCH ENSAM-R';
export const DEFAULT_DESCRIPTION =
  'Discover original ENSAM Rabat T-shirts, custom printing and design services. Orders and payment are handled directly through WhatsApp.';
export const DEFAULT_SOCIAL_IMAGE =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_3GNa7EkhqeL3HHNhlp99MWIEnhE/5dc29100-1984-4536-835b-777648d6138d.png';

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string;
}): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url,
      title,
      description,
      images: [
        {
          url: image,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
