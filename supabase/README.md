# Supabase setup for cart + order tracking

The storefront code expects one Supabase project and uses only the public anon key in the browser. Admin authorization is enforced with Row Level Security; no service-role key is shipped to customers.

## 1. Apply the schema

Run the SQL in:

`supabase/migrations/20260920_cart_orders.sql`

It creates:

- `profiles` for account/admin roles
- `orders` for guest and signed-in orders
- secure guest-order claiming after account sign-in
- customer-only order reads
- admin-only order updates
- a database constraint that blocks Confirmed / Preparing / Ready / Completed while payment is still unpaid

## 2. Configure the storefront

Set these build variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

The anon key is designed to be public. Do not add the Supabase service-role key to browser code.

## 3. Create the first admin

Create/sign up the account that should manage orders, then run this once in the Supabase SQL editor using the real admin email:

```sql
update public.profiles
set is_admin = true
where lower(email) = lower('ADMIN_EMAIL_HERE');
```

That account can then open `/admin`, review orders, mark payment as paid, choose cash or bank transfer, set delivery fees, update tracking status, and download receipts.

## Order flow

1. Customer adds one or more size/quantity combinations to the cart.
2. Customer checks out as guest or while signed in.
3. Guest receives an order receipt but cannot query live tracking.
4. If the guest creates/signs into an account in the same browser, stored claim tokens attach those guest orders automatically.
5. Admin reviews the order and calls the customer.
6. Admin records the agreed payment method (cash or bank transfer).
7. Payment must be marked paid before the database permits a Confirmed status.
8. Signed-in customers see status changes and can download receipts from their account.

WhatsApp contacts remain available on the Contact page for questions, sizing help and custom requests; standard merchandise checkout no longer depends on WhatsApp.


## 4. Configure Auth redirects

In Supabase Dashboard go to Authentication -> URL Configuration.

Set the Site URL to:

```
https://merch-ensamr.store
```

Add these Redirect URLs:

```
https://merch-ensamr.store/**
https://*-hssmxs-projects.vercel.app/**
```

The storefront passes the current origin back to Supabase during sign-up, so preview
confirmation emails return to the active Vercel preview and production emails return
to the store domain. The account page consumes the Auth callback, stores the session,
claims any guest orders from the same browser, and removes the auth fragment from the URL.

Existing confirmation emails created before this setting was changed may still point to
localhost or have expired; use the account page's resend-confirmation action after the
redirect configuration is updated.
