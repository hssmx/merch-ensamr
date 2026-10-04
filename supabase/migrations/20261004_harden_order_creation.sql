create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table if not exists private.order_creation_attempts (
  id bigint generated always as identity primary key,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_creation_attempts_email_created_idx
  on private.order_creation_attempts (email_hash, created_at desc);
create index if not exists order_creation_attempts_created_idx
  on private.order_creation_attempts (created_at desc);

revoke all on private.order_creation_attempts from public, anon, authenticated;

alter table public.orders
  drop constraint if exists orders_customer_name_length,
  add constraint orders_customer_name_length
    check (char_length(customer_name) between 2 and 100) not valid,
  drop constraint if exists orders_email_length,
  add constraint orders_email_length
    check (char_length(email) between 3 and 254) not valid,
  drop constraint if exists orders_phone_length,
  add constraint orders_phone_length
    check (char_length(phone) between 8 and 40) not valid,
  drop constraint if exists orders_address_length,
  add constraint orders_address_length
    check (address is null or char_length(address) <= 500) not valid,
  drop constraint if exists orders_notes_length,
  add constraint orders_notes_length
    check (notes is null or char_length(notes) <= 1500) not valid;

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
set search_path = public, extensions, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_slug text;
  v_size text;
  v_quantity integer;
  v_line integer;
  v_subtotal integer := 0;
  v_items jsonb := '[]'::jsonb;
  v_order_number text;
  v_normalized_email text := lower(trim(coalesce(p_email, '')));
  v_email_hash text;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Enter your full name.';
  end if;
  if length(trim(p_customer_name)) > 100 then
    raise exception 'Name must be 100 characters or fewer.';
  end if;
  if p_email is null or position('@' in p_email) < 2 then
    raise exception 'Enter a valid email address.';
  end if;
  if length(v_normalized_email) > 254 then
    raise exception 'Email must be 254 characters or fewer.';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    raise exception 'Enter a valid phone number.';
  end if;
  if length(trim(p_phone)) > 40 then
    raise exception 'Phone number must be 40 characters or fewer.';
  end if;
  if p_fulfillment not in ('collection', 'delivery') then
    raise exception 'Choose collection or delivery.';
  end if;
  if p_fulfillment = 'delivery' and length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'Enter a delivery address.';
  end if;
  if length(trim(coalesce(p_address, ''))) > 500 then
    raise exception 'Address must be 500 characters or fewer.';
  end if;
  if length(trim(coalesce(p_notes, ''))) > 1500 then
    raise exception 'Order notes must be 1500 characters or fewer.';
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

    select * into v_product
    from public.products
    where slug = v_slug and status = 'published';

    if not found then
      raise exception 'Unknown or unavailable product.';
    end if;
    if not (v_size = any(v_product.sizes)) then
      raise exception 'This size is not available for %.', v_product.name;
    end if;

    v_line := v_product.price * v_quantity;
    v_subtotal := v_subtotal + v_line;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'slug', v_product.slug,
      'name', v_product.name,
      'color', v_product.color,
      'size', v_size,
      'quantity', v_quantity,
      'unitPrice', v_product.price,
      'lineTotal', v_line,
      'image', v_product.back_url
    ));
  end loop;

  v_email_hash := encode(digest(v_normalized_email, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_email_hash, 0));

  delete from private.order_creation_attempts
  where created_at < now() - interval '24 hours';

  if (
    select count(*) >= 5
    from private.order_creation_attempts
    where email_hash = v_email_hash
      and created_at >= now() - interval '1 hour'
  ) then
    raise exception 'Too many order attempts. Try again later.';
  end if;

  if (
    select count(*) >= 40
    from private.order_creation_attempts
    where created_at >= now() - interval '1 minute'
  ) then
    raise exception 'The order desk is busy. Try again in a minute.';
  end if;

  insert into private.order_creation_attempts (email_hash)
  values (v_email_hash);

  loop
    v_order_number := 'ENSAM-' || to_char(now(), 'YYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (
      select 1 from public.orders where order_number = v_order_number
    );
  end loop;

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, fulfillment,
    address, notes, items, subtotal, delivery_fee, total, claim_token_hash
  )
  values (
    v_order_number, v_user_id, trim(p_customer_name), v_normalized_email,
    trim(p_phone), p_fulfillment,
    case when p_fulfillment = 'delivery' then trim(p_address) else null end,
    nullif(trim(coalesce(p_notes, '')), ''), v_items, v_subtotal, 0,
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
$$;

revoke all on function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) from public;
grant execute on function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) to anon, authenticated;
