import type { MetadataRoute } from 'next';
import { SITE_URL } from './site-metadata';
import { listPublishedProducts } from '../lib/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listPublishedProducts();
  const staticRoutes = [
    '',
    '/collection',
    '/design-studio',
    '/made-for-you',
    '/about',
    '/contact',
    '/reviews',
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency:
        path === '' || path === '/collection'
          ? ('weekly' as const)
          : ('monthly' as const),
      priority: path === '' ? 1 : path === '/collection' ? 0.9 : 0.7,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/collection/${product.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
