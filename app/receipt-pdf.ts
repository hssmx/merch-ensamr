import type { Product } from './catalog';

type ReceiptInput = {
  product: Product;
  size: string;
  quantity: number;
};

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/([\\()])/g, '\\$1');
}

function pdfText(
  value: string,
  x: number,
  y: number,
  size: number,
  font: 'F1' | 'F2' = 'F1',
  color = '0.06 0.055 0.055',
) {
  return `${color} rg BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${clean(value)}) Tj ET`;
}

export function downloadOrderReceipt({
  product,
  size,
  quantity,
}: ReceiptInput) {
  const total = product.price * quantity;
  const now = new Date();
  const reference = `REQ-${product.number}-${now.getTime().toString().slice(-7)}`;
  const issued = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);

  const content = [
    '0.965 0.953 0.925 rg 0 0 595 842 re f',
    '0.055 0.05 0.05 rg 0 710 595 132 re f',
    pdfText('MERCH', 42, 776, 31, 'F2', '1 1 1'),
    '0.47 0.086 0.145 rg 42 742 82 20 re f',
    pdfText('ENSAM-R', 52, 748, 9, 'F2', '1 1 1'),
    pdfText('ORDER REQUEST', 418, 777, 9, 'F2', '0.72 0.69 0.65'),
    pdfText(reference, 418, 755, 11, 'F1', '1 1 1'),
    pdfText('UNCONFIRMED', 42, 650, 12, 'F2', '0.47 0.086 0.145'),
    '0.47 0.086 0.145 RG 1.5 w 38 631 140 42 re S',
    pdfText('ORDER SUMMARY', 42, 564, 27, 'F2'),
    pdfText(
      'This document records your request before team confirmation.',
      42,
      537,
      11,
      'F1',
      '0.39 0.37 0.34',
    ),
    '0.80 0.77 0.71 RG 1 w 42 501 m 553 501 l S',
    pdfText('DESIGN', 42, 469, 8, 'F2', '0.47 0.086 0.145'),
    pdfText(product.name.toUpperCase(), 42, 442, 17, 'F2'),
    pdfText('COLOR', 42, 394, 8, 'F2', '0.47 0.086 0.145'),
    pdfText(product.color.toUpperCase(), 42, 370, 12, 'F1'),
    pdfText('SIZE', 220, 394, 8, 'F2', '0.47 0.086 0.145'),
    pdfText(size.toUpperCase(), 220, 370, 12, 'F1'),
    pdfText('QUANTITY', 360, 394, 8, 'F2', '0.47 0.086 0.145'),
    pdfText(String(quantity), 360, 370, 12, 'F1'),
    '0.80 0.77 0.71 RG 1 w 42 334 m 553 334 l S',
    pdfText('UNIT PRICE', 42, 298, 9, 'F2', '0.39 0.37 0.34'),
    pdfText(`${product.price} MAD`, 447, 298, 12, 'F2'),
    pdfText('ITEMS SUBTOTAL', 42, 257, 9, 'F2', '0.39 0.37 0.34'),
    pdfText(`${total} MAD`, 447, 257, 12, 'F2'),
    '0.47 0.086 0.145 rg 42 177 511 52 re f',
    pdfText('REQUEST TOTAL', 60, 197, 10, 'F2', '1 1 1'),
    pdfText(`${total} MAD`, 447, 195, 18, 'F2', '1 1 1'),
    pdfText(
      'Delivery fees, availability and payment are confirmed on WhatsApp.',
      42,
      132,
      10,
      'F1',
      '0.39 0.37 0.34',
    ),
    pdfText(
      'A confirmed receipt is issued after the team accepts the order.',
      42,
      112,
      10,
      'F1',
      '0.39 0.37 0.34',
    ),
    pdfText(
      `CREATED ${issued.toUpperCase()}  /  MERCH ENSAM-R`,
      42,
      53,
      8,
      'F2',
      '0.47 0.086 0.145',
    ),
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];

  let pdf = '%PDF-1.4\n%MERCH-ENSAM-R\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([new TextEncoder().encode(pdf)], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `MERCH-ENSAM-R-${reference}-UNCONFIRMED.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
