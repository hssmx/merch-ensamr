import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products } from '../../catalog';
import ProductDetail from '../../product-detail';
import { pageMetadata } from '../../site-metadata';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  if (!p) {
    return {
      title: 'Product not found | MERCH ENSAM-R',
      robots: { index: false, follow: false },
    };
  }

  return pageMetadata({
    title: `${p.name} — ${p.price} MAD | MERCH ENSAM-R`,
    description: p.description,
    path: `/collection/${p.slug}`,
    image: p.model,
  });
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  if (!p) notFound();
  return <ProductDetail product={p} />;
}
