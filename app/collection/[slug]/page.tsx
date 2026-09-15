import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products } from '../../catalog';
import ProductDetail from '../../product-detail';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  return {
    title: p
      ? `${p.name} — ${p.price} MAD | MERCH ENSAM RABAT`
      : 'Product not found | MERCH ENSAM RABAT',
    description: p?.description,
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = products.find((p) => p.slug === slug);
  if (!p) notFound();
  return <ProductDetail product={p} />;
}
