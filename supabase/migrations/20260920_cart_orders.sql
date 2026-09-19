create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  fulfillment text not null check (fulfillment in ('collection', 'delivery')),
  address text,
  notes text,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending_confirmation'
    check (status in (
      'pending_confirmation',
      'awaiting_payment',
      'confirmed',
      'preparing',
      'ready',
      'completed',
      'cancelled'
    )),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  payment_method text check (payment_method is null or payment_method in ('cash', 'bank_transfer')),
  admin_note text,
  claim_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint paid_before_confirmation check (
    status not in ('confirmed', 'preparing', 'ready', 'completed')
    or payment_status = 'paid'
  )
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_claim_token_hash_idx on public.orders(claim_token_hash);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "orders_select_owner_or_admin" on public.orders;
create policy "orders_select_owner_or_admin"
on public.orders for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
on public.orders for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, full_name)
select
  id,
  email,
  nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', '')), '')
from auth.users
on conflict (id) do nothing;

create or replace function public.create_store_order(
  p_customer_name text,
  p_email text,
  p_phone text,
  p_fulfillment text,
  p_address text,
  p_notes text,
  p_items jsonb,
  p_claim_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders;
  v_item jsonb;
  v_slug text;
  v_size text;
  v_quantity integer;
  v_name text;
  v_color text;
  v_image text;
  v_price integer;
  v_line integer;
  v_subtotal integer := 0;
  v_items jsonb := '[]'::jsonb;
  v_order_number text;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Enter your full name.';
  end if;
  if p_email is null or position('@' in p_email) < 2 then
    raise exception 'Enter a valid email address.';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    raise exception 'Enter a valid phone number.';
  end if;
  if p_fulfillment not in ('collection', 'delivery') then
    raise exception 'Choose collection or delivery.';
  end if;
  if p_fulfillment = 'delivery' and length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'Enter a delivery address.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if jsonb_array_length(p_items) > 20 then
    raise exception 'Too many separate cart lines.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_slug := v_item ->> 'slug';
    v_size := upper(trim(v_item ->> 'size'));
    v_quantity := greatest(1, least(99, coalesce((v_item ->> 'quantity')::integer, 1)));

    if v_size not in ('S', 'M', 'L', 'XL', 'XXL') then
      raise exception 'Invalid size.';
    end if;

    case v_slug
      when 'mind-in-motion' then
        v_name := 'MIND IN MOTION';
        v_color := 'Black';
        v_price := 135;
        v_image := '/collection/cutouts/mind-in-motion-back.svg';
      when 'be-creative' then
        v_name := 'Be creART(et métiers)ive';
        v_color := 'Black';
        v_price := 120;
        v_image := '/collection/cutouts/be-creative-back.svg';
      when 'think-beyond-limits' then
        v_name := 'Think Beyond Limits';
        v_color := 'White';
        v_price := 120;
        v_image := '/collection/cutouts/think-beyond-limits-back.svg';
      else
        raise exception 'Unknown product.';
    end case;

    v_line := v_price * v_quantity;
    v_subtotal := v_subtotal + v_line;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'slug', v_slug,
      'name', v_name,
      'color', v_color,
      'size', v_size,
      'quantity', v_quantity,
      'unitPrice', v_price,
      'lineTotal', v_line,
      'image', v_image
    ));
  end loop;

  loop
    v_order_number := 'ENSAM-' || to_char(now(), 'YYMMDD') || '-' ||
      upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1 from public.orders where order_number = v_order_number
    );
  end loop;

  insert into public.orders (
    order_number,
    user_id,
    customer_name,
    email,
    phone,
    fulfillment,
    address,
    notes,
    items,
    subtotal,
    delivery_fee,
    total,
    claim_token_hash
  )
  values (
    v_order_number,
    v_user_id,
    trim(p_customer_name),
    lower(trim(p_email)),
    trim(p_phone),
    p_fulfillment,
    case when p_fulfillment = 'delivery' then trim(p_address) else null end,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_items,
    v_subtotal,
    0,
    v_subtotal,
    case
      when v_user_id is null and p_claim_token is not null
        then encode(digest(p_claim_token, 'sha256'), 'hex')
      else null
    end
  )
  returning * into v_order;

  return to_jsonb(v_order);
end;
$;

grant execute on function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) to anon, authenticated;

create or replace function public.claim_guest_orders(p_claim_tokens text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_claimed integer := 0;
begin
  if v_user_id is null then
    raise exception 'Sign in first.';
  end if;

  update public.orders
  set
    user_id = v_user_id,
    claim_token_hash = null,
    updated_at = now()
  where
    user_id is null
    and claim_token_hash in (
      select encode(digest(token, 'sha256'), 'hex')
      from unnest(p_claim_tokens) token
      where length(token) >= 16
    );

  get diagnostics v_claimed = row_count;
  return jsonb_build_object('claimed', v_claimed);
end;
$$;

grant execute on function public.claim_guest_orders(text[]) to authenticated;

create or replace function public.sync_order_total()
returns trigger
language plpgsql
as $$
begin
  new.total := new.subtotal + new.delivery_fee;
  new.updated_at := now();
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists sync_order_total_trigger on public.orders;
create trigger sync_order_total_trigger
before update on public.orders
for each row execute function public.sync_order_total();

grant select on public.profiles to authenticated;
grant select, update on public.orders to authenticated;
revoke insert, delete on public.orders from anon, authenticated;
revoke update on public.orders from anon;
