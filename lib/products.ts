import type { Product } from '../app/catalog';
import { products as fallbackProducts } from '../app/catalog';
import { getSession } from './supabase-rest';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from './supabase-config';

export type ProductStatus = 'draft' | 'published';

export type StoredProduct = Product & {
  id: string;
  status: ProductStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  stockTracked: boolean;
  customizable: boolean;
  customizationPlacements: string[];
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  description: string;
  print_details: string;
  front_url: string;
  back_url: string;
  model_url: string;
  number: string;
  sizes: string[];
  status: ProductStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  stock_tracked: boolean;
  customizable: boolean;
  customization_placements: string[];
};

export type NewProductInput = {
  slug: string;
  name: string;
  price: number;
  color: string;
  description: string;
  printDetails: string;
  number: string;
  sizes: string[];
  status: ProductStatus;
  sortOrder: number;
  front: File;
  back: File;
  model: File;
  customizable: boolean;
  customizationPlacements: string[];
};
export type UpdateProductInput = Omit<NewProductInput, 'front' | 'back' | 'model'> & {
  front?: File; back?: File; model?: File;
};

const productSelect = [
  'id',
  'slug',
  'name',
  'price',
  'color',
  'description',
  'print_details',
  'front_url',
  'back_url',
  'model_url',
  'number',
  'sizes',
  'status',
  'sort_order',
  'created_at',
  'updated_at',
  'stock_tracked',
  'customizable',
  'customization_placements',
].join(',');

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function mapProduct(row: ProductRow): StoredProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    color: row.color,
    description: row.description,
    printDetails: row.print_details,
    front: row.front_url,
    back: row.back_url,
    model: row.model_url,
    number: row.number,
    sizes: row.sizes,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stockTracked: row.stock_tracked,
    customizable: row.customizable ?? false,
    customizationPlacements: row.customization_placements ?? ['Front','Back','Left sleeve','Right sleeve'],
  };
}

function fallbackAsStored(): StoredProduct[] {
  return fallbackProducts.map((product, index) => ({
    ...product,
    id: product.slug,
    status: 'published',
    sortOrder: (index + 1) * 10,
    createdAt: '',
    updatedAt: '',
    stockTracked: false,
    customizable: false,
    customizationPlacements: ['Front','Back','Left sleeve','Right sleeve'],
  }));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message =
      payload?.message || payload?.error_description || payload?.error;
    throw new Error(message || `Product request failed (${response.status}).`);
  }
  return payload as T;
}

export async function listPublishedProducts(): Promise<StoredProduct[]> {
  if (!configured()) return fallbackAsStored();
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=${productSelect}&status=eq.published&order=sort_order.asc,created_at.asc`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        cache: 'no-store',
      },
    );
    const rows = await parseResponse<ProductRow[]>(response);
    return rows.length ? rows.map(mapProduct) : fallbackAsStored();
  } catch {
    return fallbackAsStored();
  }
}

export async function getPublishedProduct(
  slug: string,
): Promise<StoredProduct | null> {
  const fallback =
    fallbackAsStored().find((product) => product.slug === slug) ?? null;
  if (!configured()) return fallback;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=${productSelect}&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        cache: 'no-store',
      },
    );
    const rows = await parseResponse<ProductRow[]>(response);
    return rows[0] ? mapProduct(rows[0]) : fallback;
  } catch {
    return fallback;
  }
}

export async function listAdminProducts(): Promise<StoredProduct[]> {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=${productSelect}&order=sort_order.asc,created_at.asc`,
    {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );
  return (await parseResponse<ProductRow[]>(response)).map(mapProduct);
}

function safeFileExtension(file: File) {
  const byType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const extension = byType[file.type];
  if (!extension) throw new Error('Images must be JPG, PNG or WebP.');
  if (file.size > 6 * 1024 * 1024)
    throw new Error('Each image must be 6 MB or smaller.');
  return extension;
}

async function uploadProductImage(
  file: File,
  slug: string,
  label: 'front' | 'back' | 'model',
  token: string,
) {
  const extension = safeFileExtension(file);
  const path = `${slug}/${Date.now()}-${label}.${extension}`;
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/product-images/${path}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
      body: file,
    },
  );
  await parseResponse(response);
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

export async function adminCreateProduct(input: NewProductInput) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  if (!configured()) throw new Error('Store backend is not configured.');

  const [front, back, model] = await Promise.all([
    uploadProductImage(input.front, input.slug, 'front', session.access_token),
    uploadProductImage(input.back, input.slug, 'back', session.access_token),
    uploadProductImage(input.model, input.slug, 'model', session.access_token),
  ]);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      slug: input.slug,
      name: input.name,
      price: input.price,
      color: input.color,
      description: input.description,
      print_details: input.printDetails,
      front_url: front,
      back_url: back,
      model_url: model,
      number: input.number,
      sizes: input.sizes,
      status: input.status,
      sort_order: input.sortOrder,
      created_by: session.user.id,
      customizable: input.customizable,
      customization_placements: input.customizationPlacements,
    }),
  });
  const rows = await parseResponse<ProductRow[]>(response);
  if (!rows[0]) throw new Error('The product could not be created.');
  return mapProduct(rows[0]);
}

export async function adminUpdateProduct(id: string, input: UpdateProductInput) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  const existing = (await listAdminProducts()).find((product) => product.id === id);
  if (!existing) throw new Error('Product not found.');
  const [front, back, model] = await Promise.all([
    input.front ? uploadProductImage(input.front, input.slug, 'front', session.access_token) : existing.front,
    input.back ? uploadProductImage(input.back, input.slug, 'back', session.access_token) : existing.back,
    input.model ? uploadProductImage(input.model, input.slug, 'model', session.access_token) : existing.model,
  ]);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ slug: input.slug, name: input.name, price: input.price, color: input.color,
      description: input.description, print_details: input.printDetails, front_url: front, back_url: back,
      model_url: model, number: input.number, sizes: input.sizes, status: input.status,
      sort_order: input.sortOrder, customizable: input.customizable,
      customization_placements: input.customizationPlacements }),
  });
  const rows = await parseResponse<ProductRow[]>(response);
  if (!rows[0]) throw new Error('The product could not be updated.');
  return mapProduct(rows[0]);
}
