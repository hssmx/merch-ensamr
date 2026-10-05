'use client';

import type {
  AdminSavedView,
  CustomerNotification,
  CustomerProfile,
  InternalOrderNote,
  OrderActivity,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductInventory,
  StaffRole,
  StoredOrder,
} from './order-types';
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from './supabase-config';

const SESSION_KEY = 'merch-ensamr-auth-session';
const CLAIM_KEY = 'merch-ensamr-guest-order-claims';
const PENDING_CONFIRMATION_KEY = 'merch-ensamr-pending-confirmation';
const CONFIRMATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
  items: Array<{ slug: string; size: string; quantity: number; customization?: import('./order-types').ProductCustomization }>;
};

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

function authHeaders(token?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Store checkout is not configured yet.');
  }

  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token || SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function api<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(authHeaders(token));
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers,
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
  clearPendingConfirmation();
  await claimLocalGuestOrders(session);
  return session;
}

function authRedirectUrl() {
  if (typeof window === 'undefined') {
    return 'https://merch-ensamr.store/account?confirmed=1';
  }
  return `${window.location.origin}/account?confirmed=1`;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  ageConfirmed: boolean,
) {
  if (!ageConfirmed) {
    throw new Error('You must confirm that you are at least 16 to create an account.');
  }
  const redirectTo = authRedirectUrl();
  const normalizedEmail = email.trim().toLowerCase();
  rememberPendingConfirmation(normalizedEmail);
  const result = await api<
    Partial<AuthSession> & { user?: AuthUser; identities?: unknown[] }
  >(
    `/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        data: {
          full_name: name.trim(),
          age_confirmed_16_plus: true,
          terms_accepted_at: new Date().toISOString(),
        },
      }),
    },
  );

  if (result.access_token && result.refresh_token && result.user) {
    const session = result as AuthSession;
    saveSession(session);
    clearPendingConfirmation();
    await claimLocalGuestOrders(session);
  }

  return result;
}

export async function consumeAuthRedirect() {
  if (typeof window === 'undefined') {
    return { session: null as AuthSession | null, error: null as string | null };
  }

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const error = hash.get('error_description') || hash.get('error');
  if (error) {
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    return { session: null as AuthSession | null, error };
  }

  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (!accessToken || !refreshToken) {
    return { session: null as AuthSession | null, error: null as string | null };
  }

  window.history.replaceState({}, '', window.location.pathname + window.location.search);

  if (new URLSearchParams(window.location.search).get('confirmed') !== '1') {
    return {
      session: null as AuthSession | null,
      error: 'This confirmation link is not valid for this page. Sign in to continue.',
    };
  }

  const pending = readPendingConfirmation();
  if (!pending) {
    return {
      session: null as AuthSession | null,
      error: 'Email confirmation completed. Sign in with your password to continue.',
    };
  }

  try {
    const user = await api<AuthUser>('/auth/v1/user', {}, accessToken);
    if (user.email?.trim().toLowerCase() !== pending.email) {
      return {
        session: null as AuthSession | null,
        error: 'This confirmation does not match the account created in this browser. Sign in to continue.',
      };
    }
    const session: AuthSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: Number(hash.get('expires_in') || 3600),
      user,
    };
    saveSession(session);
    clearPendingConfirmation();
    await claimLocalGuestOrders(session);
    return { session, error: null as string | null };
  } catch (err) {
    return {
      session: null as AuthSession | null,
      error: err instanceof Error ? err.message : 'Could not finish email confirmation.',
    };
  }
}

export async function resendSignupConfirmation(email: string) {
  const redirectTo = authRedirectUrl();
  const normalizedEmail = email.trim().toLowerCase();
  rememberPendingConfirmation(normalizedEmail);
  return api(
    `/auth/v1/resend?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'signup',
        email: normalizedEmail,
      }),
    },
  );
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

export async function getMyProfile() {
  const session = await getSession();
  if (!session) return null;
  const rows = await api<CustomerProfile[]>(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=*`,
    {},
    session.access_token,
  );
  return rows[0] ?? null;
}

export async function updateMyProfile(values: {
  full_name: string;
  phone: string | null;
}) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  const rows = await api<CustomerProfile[]>(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(values),
    },
    session.access_token,
  );
  return rows[0];
}

export async function listMyNotifications() {
  const session = await getSession();
  if (!session) return [] as CustomerNotification[];
  return api<CustomerNotification[]>(
    '/rest/v1/customer_notifications?select=*&order=created_at.desc&limit=30',
    {},
    session.access_token,
  );
}

export async function markNotificationRead(id: number) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  await api(
    `/rest/v1/customer_notifications?id=eq.${id}`,
    { method: 'PATCH', body: JSON.stringify({ read_at: new Date().toISOString() }) },
    session.access_token,
  );
}

export async function listOrderActivity(orderId: string) {
  const session = await getSession();
  if (!session) return [] as OrderActivity[];
  return api<OrderActivity[]>(
    `/rest/v1/order_activity?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=created_at.desc`,
    {},
    session.access_token,
  );
}

export async function isCurrentUserAdmin() {
  const session = await getSession();
  if (!session) return false;
  const isAdmin = await api<boolean>(
    '/rest/v1/rpc/current_user_is_admin',
    { method: 'POST', body: '{}' },
    session.access_token,
  );
  return isAdmin === true;
}

export async function getCurrentUserRole() {
  const session = await getSession();
  if (!session) return 'customer' as StaffRole;
  return api<StaffRole>(
    '/rest/v1/rpc/current_user_role',
    { method: 'POST', body: '{}' },
    session.access_token,
  );
}

type PendingConfirmation = {
  email: string;
  createdAt: number;
};

function rememberPendingConfirmation(email: string) {
  if (typeof window === 'undefined') return;
  const pending: PendingConfirmation = {
    email: email.trim().toLowerCase(),
    createdAt: Date.now(),
  };
  localStorage.setItem(PENDING_CONFIRMATION_KEY, JSON.stringify(pending));
}

function readPendingConfirmation(): PendingConfirmation | null {
  if (typeof window === 'undefined') return null;
  try {
    const pending = JSON.parse(
      localStorage.getItem(PENDING_CONFIRMATION_KEY) || 'null',
    ) as PendingConfirmation | null;
    if (
      !pending?.email ||
      !pending.createdAt ||
      Date.now() - pending.createdAt > CONFIRMATION_MAX_AGE_MS
    ) {
      localStorage.removeItem(PENDING_CONFIRMATION_KEY);
      return null;
    }
    return pending;
  } catch {
    localStorage.removeItem(PENDING_CONFIRMATION_KEY);
    return null;
  }
}

function clearPendingConfirmation() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_CONFIRMATION_KEY);
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
    customer_update: string | null;
    internal_note: string | null;
  },
) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<StoredOrder>(
    '/rest/v1/rpc/admin_update_order',
    {
      method: 'POST',
      body: JSON.stringify({
        p_order_id: id,
        p_status: values.status,
        p_payment_status: values.payment_status,
        p_payment_method: values.payment_method,
        p_delivery_fee: values.delivery_fee,
        p_customer_update: values.customer_update,
        p_internal_note: values.internal_note,
      }),
    },
    session.access_token,
  );
}

export async function listAdminOrderActivity() {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<OrderActivity[]>(
    '/rest/v1/order_activity?select=*&order=created_at.desc&limit=500',
    {},
    session.access_token,
  );
}

export async function listInternalOrderNotes() {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<InternalOrderNote[]>(
    '/rest/v1/internal_order_notes?select=*&order=created_at.desc&limit=500',
    {},
    session.access_token,
  );
}

export async function listInventory() {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<ProductInventory[]>(
    '/rest/v1/product_inventory?select=*&order=product_id.asc,size.asc',
    {},
    session.access_token,
  );
}

export async function listProductAvailability(productId: string) {
  return api<ProductInventory[]>(
    `/rest/v1/product_inventory?product_id=eq.${encodeURIComponent(productId)}&select=product_id,size,is_available,almost_sold_out,updated_at`,
  );
}

export async function adminSetInventory(values: {
  product_id: string;
  size: string;
  is_available: boolean;
  almost_sold_out: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<ProductInventory>(
    '/rest/v1/rpc/admin_set_size_availability',
    {
      method: 'POST',
      body: JSON.stringify({
        p_product_id: values.product_id,
        p_size: values.size,
        p_is_available: values.is_available,
        p_almost_sold_out: values.almost_sold_out,
      }),
    },
    session.access_token,
  );
}

function customizationExtension(file: File) {
  const extensions: Record<string,string> = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  const extension = extensions[file.type];
  if (!extension) throw new Error('Customization files must be JPG, PNG or WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Each customization file must be 20 MB or smaller.');
  return extension;
}

export async function uploadCustomizationFiles(files: File[], kind: 'artwork' | 'reference', requestId: string) {
  const session = await getSession();
  return Promise.all(files.map(async (file, index) => {
    const extension = customizationExtension(file);
    const path = `incoming/${requestId}/${kind}-${index}.${extension}`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/customization-files/${path}`, {
      method: 'POST', headers: { apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session?.access_token || SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': file.type, 'x-upsert': 'false' }, body: file,
    });
    if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.message || 'Could not upload a customization image.'); }
    return { path, name: file.name.slice(0, 160) };
  }));
}

export async function downloadCustomizationFile(path: string, filename: string) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/customization-files/${path}`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) throw new Error('Could not download this file.');
  const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export async function adminBulkUpdateOrders(ids: string[], status: OrderStatus) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<number>(
    '/rest/v1/rpc/admin_bulk_update_orders',
    { method: 'POST', body: JSON.stringify({ p_order_ids: ids, p_status: status }) },
    session.access_token,
  );
}

export async function adminDeleteCancelledOrder(id: string) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<boolean>(
    '/rest/v1/rpc/admin_delete_cancelled_order',
    { method: 'POST', body: JSON.stringify({ p_order_id: id }) },
    session.access_token,
  );
}

export async function listSavedViews() {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<AdminSavedView[]>(
    '/rest/v1/admin_saved_views?select=*&order=name.asc',
    {},
    session.access_token,
  );
}

export async function saveAdminView(name: string, filters: Record<string, unknown>) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  const rows = await api<AdminSavedView[]>(
    '/rest/v1/admin_saved_views?on_conflict=user_id,name',
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        user_id: session.user.id,
        name,
        filters,
        updated_at: new Date().toISOString(),
      }),
    },
    session.access_token,
  );
  return rows[0];
}

export async function listStaffProfiles() {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<CustomerProfile[]>(
    '/rest/v1/profiles?select=*&order=created_at.asc',
    {},
    session.access_token,
  );
}

export async function adminSetStaffRole(userId: string, role: StaffRole) {
  const session = await getSession();
  if (!session) throw new Error('Sign in first.');
  return api<CustomerProfile>(
    '/rest/v1/rpc/admin_set_staff_role',
    { method: 'POST', body: JSON.stringify({ p_user_id: userId, p_role: role }) },
    session.access_token,
  );
}

export type { OrderItem, StoredOrder };
