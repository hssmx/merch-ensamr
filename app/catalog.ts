export type Product = {
  slug: string;
  name: string;
  price: number;
  color: string;
  description: string;
  front: string;
  back: string;
  number: string;
};
export const products: Product[] = [
  {
    slug: 'mind-in-motion',
    name: 'MIND IN MOTION',
    price: 135,
    color: 'Black',
    number: '01',
    description:
      'Black T-shirt with cream and violet artwork. A compact Mind in Motion print sits on the front, with the full composition across the back.',
    front: '/collection/mind-in-motion-front.webp',
    back: '/collection/mind-in-motion-back.webp',
  },
  {
    slug: 'be-creative',
    name: 'Be creART(et métiers)ive',
    price: 120,
    color: 'Black',
    number: '02',
    description:
      'Black T-shirt with a red and white ENSAM mark on the front and the Be creART(et métiers)ive artwork across the back.',
    front: '/collection/be-creative-front.webp',
    back: '/collection/be-creative-back.webp',
  },
  {
    slug: 'think-beyond-limits',
    name: 'Think Beyond Limits',
    price: 120,
    color: 'White',
    number: '03',
    description:
      'White T-shirt with a compact ENSAM mark on the front and the deep-red Think Beyond Limits artwork across the back.',
    front: '/collection/think-beyond-limits-front.webp',
    back: '/collection/think-beyond-limits-back.webp',
  },
];
export function orderMessage(product: Product, size: string, quantity: number) {
  if (
    !size.trim() ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 99
  )
    throw new Error('Choose a size and a quantity between 1 and 99.');
  return `Hi MERCH ENSAMR! I would like to order:\n\n${product.name}\nColor: ${product.color}\nRequested size: ${size.trim()}\nQuantity: ${quantity}\nUnit price: ${product.price} MAD\nItems subtotal: ${product.price * quantity} MAD\n\nPlease confirm size availability, delivery or collection details, any delivery fees, and how to pay.`;
}
export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/[\s()+-]/g, '');
  if (!/^\d{8,15}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
