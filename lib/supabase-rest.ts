'use client';

import type {
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StoredOrder,
} from './order-types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SESSION_KEY = 'merch-ensamr-auth-session';
const CLAIM_KEY = 'merch-ensamr-guest-order-claims';

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: AuthUser;
};

type CheckoutInput = {
  customerName: string;
  email: string;
  phone: string;
  fulfillment: 'collection' | 'delivery';
  address?: string;
  notes?: string;
  items: Array<{ slug: string; size: string; quantity: number }>;
};

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function authHeaders(token?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Store checkout is not configured yet.');
  }

  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function api<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      payload?.msg ||
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      'Something went wrong.';
    throw new Error(message);
  }

  return payload as T;
}

function saveSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('merch-auth-change'));
    return;
  }
  const normalized = {
    ...session,
    expires_at:
      session.expires_at ??
      Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event('merch-auth-change'));
}

function readSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as AuthSession | null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const session = readSession();
  if (!session) return null;
  if ((session.expires_at ?? 0) > Math.floor(Date.now() / 1000) + 60) {
    return session;
  }
  if (!session.refresh_token) {
    saveSession(null);
    return null;
  }

  try {
    const refreshed = await api<AuthSession>(
      '/auth/v1/token?grant_type=refresh_token',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      },
    );
    saveSession(refreshed);
    return readSession();
  } catch {
    saveSession(null);
    return null;
  }
}

export async function signIn(email: string, password: string) {
  const session = await api<AuthSession>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  saveSession(session);
  await claimLocalGuestOrders(session);
  return session;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
) {
  const result = await api<AuthSession & { identities?: unknown[] }>('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      data: { full_name: name.trim() },
    }),
  });

  if (result.access_token) {
    saveSession(result);
    await claimLocalGuestOrders(result);
  }
  return result;
}

export async function signOut() {
  const session = await getSession();
  if (session) {
    try {
      await api('/auth/v1/logout', { method: 'POST' }, session.access_token);
    } catch {
      // Local sign-out still succeeds if the remote session has expired.
    }
  }
  saveSession(null);
}

function rememberClaim(token: string) {
  if (typeof window === 'undefined') return;
  let claims: string[] = [];
  try {
    claims = JSON.parse(localStorage.getItem(CLAIM_KEY) || '[]');
  } catch {
    claims = [];
  }
  const next = Array.from(new Set([...claims, token])).slice(-20);
  localStorage.setItem(CLAIM_KEY, JSON.stringify(next));
}

function getClaims() {
  if (typeof window === 'undefined') return [] as string[];
  try {
    return JSON.parse(localStorage.getItem(CLAIM_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

export async function claimLocalGuestOrders(session?: AuthSession | null) {
  const active = session ?? (await getSession());
  const claims = getClaims();
  if (!active || !claims.length) return 0;
  const result = await api<{ claimed: number }>(
    '/rest/v1/rpc/claim_guest_orders',
    {
      method: 'POST',
      body: JSON.stringify({ p_claim_tokens: claims }),
    },
    active.access_token,
  );
  if (result.claimed > 0 && typeof window !== 'undefined') {
    localStorage.removeItem(CLAIM_KEY);
  }
  return result.claimed;
}

export async function createOrder(input: CheckoutInput) {
  const session = await getSession();
  const claimToken = session ? null : `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const order = await api<StoredOrder>(
    '/rest/v1/rpc/create_store_order',
    {
      method: 'POST',
      body: JSON.stringify({
        p_customer_name: input.customerName.trim(),
        p_email: input.email.trim().toLowerCase(),
        p_phone: input.phone.trim(),
        p_fulfillment: input.fulfillment,
        p_address: input.address?.trim() || null,
        p_notes: input.notes?.trim() || null,
        p_items: input.items,
        p_claim_token: claimToken,
      }),
    },
    session?.access_token,
  );
  if (claimToken) rememberClaim(claimToken);
  return order;
}

export async function listMyOrders() {
  const session = await getSession();
  if (!session) return [] as StoredOrder[];
  await claimLocalGuestOrders(session);
  return api<StoredOrder[]>(
    '/rest/v1/orders?select=*&order=created_at.desc',
    {},
    session.access_token,
  );
}

export async function getMyOrder(id: string) {
  const session = await getSession();
  if (!session) return null;
  const rows = await api<StoredOrder[]>(
    `/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=*`,
    {},
    session.access_token,
  );
  return rows[0] ?? null;
}

export async function isCurrentUserAdmin() {
  const session = await getSession();
  if (!session) return false;
  const rows = await api<Array<{ is_admin: boolean }>>(
    `/rest/v1/profiles?id=eq.${session.user.id}&select=is_admin`,
    {},
    session.access_token,
  );
  return Boolean(rows[0]?.is_admin);
}

export async function listAllOrders() {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<StoredOrder[]>(
    '/rest/v1/orders?select=*&order=created_at.desc',
    {},
    session.access_token,
  );
}

export async function adminUpdateOrder(
  id: string,
  values: {
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod | null;
    delivery_fee: number;
    admin_note: string | null;
  },
) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  const rows = await api<StoredOrder[]>(
    `/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(values),
    },
    session.access_token,
  );
  return rows[0];
}

export type { OrderItem, StoredOrder };
