import type { StoredOrder } from '../lib/order-types';

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

function short(value: string, max = 44) {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

export function downloadOrderReceipt(order: StoredOrder) {
  const issued = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(order.created_at));

  const payment =
    order.payment_status === 'paid'
      ? `PAID · ${order.payment_method === 'bank_transfer' ? 'BANK TRANSFER' : 'CASH'}`
      : 'UNPAID · AWAITING MANUAL CONFIRMATION';

  const lines = [
    '0.965 0.953 0.925 rg 0 0 595 842 re f',
    '0.055 0.05 0.05 rg 0 710 595 132 re f',
    pdfText('MERCH', 42, 776, 31, 'F2', '1 1 1'),
    '0.47 0.086 0.145 rg 42 742 82 20 re f',
    pdfText('ENSAM-R', 52, 748, 9, 'F2', '1 1 1'),
    pdfText('ORDER RECEIPT', 408, 777, 9, 'F2', '0.72 0.69 0.65'),
    pdfText(order.order_number, 408, 755, 10, 'F1', '1 1 1'),
    pdfText(short(order.customer_name.toUpperCase(), 36), 42, 665, 20, 'F2'),
    pdfText(short(order.email, 58), 42, 642, 9, 'F1', '0.39 0.37 0.34'),
    pdfText(short(order.phone, 35), 42, 624, 9, 'F1', '0.39 0.37 0.34'),
    '0.80 0.77 0.71 RG 1 w 42 598 m 553 598 l S',
    pdfText('ORDER ITEMS', 42, 570, 8, 'F2', '0.47 0.086 0.145'),
  ];

  let y = 540;
  for (const item of order.items.slice(0, 10)) {
    lines.push(pdfText(short(item.name.toUpperCase(), 34), 42, y, 11, 'F2'));
    lines.push(
      pdfText(
        `${item.color.toUpperCase()} / ${item.size} / QTY ${item.quantity}`,
        42,
        y - 16,
        8,
        'F1',
        '0.39 0.37 0.34',
      ),
    );
    lines.push(pdfText(`${item.lineTotal} MAD`, 468, y, 10, 'F2'));
    y -= 42;
  }

  if (order.items.length > 10) {
    lines.push(pdfText(`+${order.items.length - 10} MORE CART LINES`, 42, y, 8, 'F2'));
    y -= 30;
  }

  const totalsY = Math.max(182, y - 6);
  lines.push(
    '0.80 0.77 0.71 RG 1 w 42 ' + (totalsY + 28) + ' m 553 ' + (totalsY + 28) + ' l S',
    pdfText('ITEMS SUBTOTAL', 42, totalsY, 9, 'F2', '0.39 0.37 0.34'),
    pdfText(`${order.subtotal} MAD`, 466, totalsY, 11, 'F2'),
    pdfText('DELIVERY FEE', 42, totalsY - 30, 9, 'F2', '0.39 0.37 0.34'),
    pdfText(`${order.delivery_fee} MAD`, 466, totalsY - 30, 11, 'F2'),
    '0.47 0.086 0.145 rg 42 ' + (totalsY - 94) + ' 511 46 re f',
    pdfText('ORDER TOTAL', 60, totalsY - 77, 9, 'F2', '1 1 1'),
    pdfText(`${order.total} MAD`, 454, totalsY - 79, 16, 'F2', '1 1 1'),
    pdfText(short(payment, 64), 42, 76, 9, 'F2', '0.47 0.086 0.145'),
    pdfText(
      'Orders are confirmed manually by the MERCH ENSAM-R team.',
      42,
      57,
      8,
      'F1',
      '0.39 0.37 0.34',
    ),
    pdfText(
      `CREATED ${issued.toUpperCase()} / ${order.status.replaceAll('_', ' ').toUpperCase()}`,
      42,
      38,
      7,
      'F1',
      '0.39 0.37 0.34',
    ),
  );

  const stream = lines.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
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
  anchor.download = `MERCH-ENSAM-R-${order.order_number}.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
