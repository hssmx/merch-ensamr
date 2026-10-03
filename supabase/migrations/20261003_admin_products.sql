create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 100),
  price integer not null check (price between 1 and 100000),
  color text not null check (char_length(trim(color)) between 2 and 40),
  description text not null check (char_length(trim(description)) between 10 and 1000),
  print_details text not null default 'Front & back printed' check (char_length(trim(print_details)) between 2 and 100),
  front_url text not null,
  back_url text not null,
  model_url text not null,
  number text not null check (number ~ '^[0-9]{2,3}$'),
  sizes text[] not null default array['S','M','L','XL','XXL']::text[],
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 100 check (sort_order between 0 and 10000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_product_sizes check (
    cardinality(sizes) > 0
    and sizes <@ array['S','M','L','XL','XXL']::text[]
  )
);

create index if not exists products_status_sort_idx
  on public.products(status, sort_order, created_at);
create index if not exists products_created_by_idx on public.products(created_by);

alter table public.products enable row level security;
revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

drop policy if exists "products_read_published_anon" on public.products;
create policy "products_read_published_anon"
on public.products for select
to anon
using (status = 'published');

drop policy if exists "products_read_authenticated" on public.products;
create policy "products_read_authenticated"
on public.products for select
to authenticated
using (status = 'published' or (select public.current_user_is_admin()));

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products for insert
to authenticated
with check (
  (select public.current_user_is_admin())
  and created_by = (select auth.uid())
);

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products for delete
to authenticated
using ((select public.current_user_is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  6291456,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select public.current_user_is_admin())
);

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and (select public.current_user_is_admin()))
with check (bucket_id = 'product-images' and (select public.current_user_is_admin()));

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and (select public.current_user_is_admin()));

insert into public.products (
  slug, name, price, color, description, print_details,
  front_url, back_url, model_url, number, sizes, status, sort_order
)
values
  (
    'mind-in-motion', 'MIND IN MOTION', 135, 'Black',
    'Black T-shirt with cream and violet artwork. A compact Mind in Motion print sits on the front, with the full composition across the back.',
    'Front & back printed',
    '/collection/cutouts/mind-in-motion-front.svg',
    '/collection/cutouts/mind-in-motion-back.svg',
    '/lookbook/mind-in-motion-models.webp',
    '01', array['S','M','L','XL','XXL']::text[], 'published', 10
  ),
  (
    'be-creative', 'Be creART(et métiers)ive', 120, 'Black',
    'Black T-shirt with a red and white ENSAM mark on the front and the Be creART(et métiers)ive artwork across the back.',
    'Front & back printed',
    '/collection/cutouts/be-creative-front.svg',
    '/collection/cutouts/be-creative-back.svg',
    '/lookbook/be-creative-models.webp',
    '02', array['S','M','L','XL','XXL']::text[], 'published', 20
  ),
  (
    'think-beyond-limits', 'Think Beyond Limits', 120, 'White',
    'White T-shirt with a compact ENSAM mark on the front and the deep-red Think Beyond Limits artwork across the back.',
    'Front & back printed',
    '/collection/cutouts/think-beyond-limits-front.svg',
    '/collection/cutouts/think-beyond-limits-back.svg',
    '/lookbook/think-beyond-limits-models.webp',
    '03', array['S','M','L','XL','XXL']::text[], 'published', 30
  )
on conflict (slug) do nothing;

create or replace function public.touch_product_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_product_updated_at_trigger on public.products;
create trigger touch_product_updated_at_trigger
before update on public.products
for each row execute function public.touch_product_updated_at();

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
set search_path = public, extensions
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
    v_order_number, v_user_id, trim(p_customer_name), lower(trim(p_email)),
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
