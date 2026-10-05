-- Boolean size availability, customizable products, and private customer artwork.
alter table public.products
  add column if not exists customizable boolean not null default false,
  add column if not exists customization_placements text[] not null
    default array['Front','Back','Left sleeve','Right sleeve']::text[];

alter table public.product_inventory
  add column if not exists is_available boolean not null default true,
  add column if not exists almost_sold_out boolean not null default false;

update public.products set stock_tracked = false;
update public.product_inventory set is_available = true, almost_sold_out = false;

-- Numeric reservation logic is intentionally retired; availability is validated
-- atomically by create_store_order below.
drop trigger if exists manage_order_inventory_trigger on public.orders;

drop policy if exists inventory_public_read on public.product_inventory;
create policy inventory_public_read
on public.product_inventory for select to anon, authenticated
using (true);
grant select (product_id, size, is_available, almost_sold_out, updated_at)
  on public.product_inventory to anon, authenticated;

create or replace function public.admin_set_size_availability(
  p_product_id uuid,
  p_size text,
  p_is_available boolean,
  p_almost_sold_out boolean
)
returns public.product_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.product_inventory;
begin
  if not public.current_user_has_permission('inventory.manage') then
    raise exception 'You do not have permission to manage availability.';
  end if;
  p_size := upper(trim(p_size));
  if not exists (
    select 1 from public.products
    where id = p_product_id and p_size = any(sizes)
  ) then
    raise exception 'This size does not belong to the product.';
  end if;
  insert into public.product_inventory (
    product_id, size, is_available, almost_sold_out, updated_by, updated_at
  ) values (
    p_product_id, p_size, p_is_available,
    p_is_available and p_almost_sold_out, auth.uid(), now()
  )
  on conflict (product_id, size) do update set
    is_available = excluded.is_available,
    almost_sold_out = excluded.almost_sold_out,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.admin_set_size_availability(uuid,text,boolean,boolean) from public, anon;
grant execute on function public.admin_set_size_availability(uuid,text,boolean,boolean) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customization-files', 'customization-files', false, 20971520,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists customization_files_customer_insert on storage.objects;
create policy customization_files_customer_insert
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'customization-files'
  and (storage.foldername(name))[1] = 'incoming'
  and lower(storage.extension(name)) = any(array['jpg','jpeg','png','webp'])
);

drop policy if exists customization_files_staff_read on storage.objects;
create policy customization_files_staff_read
on storage.objects for select to authenticated
using (
  bucket_id = 'customization-files'
  and (select public.current_user_has_permission('orders.read'))
);

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
  v_user_id uuid := auth.uid(); v_order public.orders; v_item jsonb;
  v_product public.products; v_slug text; v_size text; v_quantity integer;
  v_line integer; v_subtotal integer := 0; v_items jsonb := '[]'::jsonb;
  v_order_number text; v_normalized_email text := lower(trim(coalesce(p_email,'')));
  v_email_hash text; v_custom jsonb; v_description text; v_placements jsonb;
  v_artwork jsonb; v_references jsonb;
begin
  if length(trim(coalesce(p_customer_name,''))) < 2 or length(trim(p_customer_name)) > 100 then raise exception 'Enter a valid full name.'; end if;
  if p_email is null or position('@' in p_email) < 2 or length(v_normalized_email) > 254 then raise exception 'Enter a valid email address.'; end if;
  if length(regexp_replace(coalesce(p_phone,''),'\D','','g')) < 8 or length(trim(p_phone)) > 40 then raise exception 'Enter a valid phone number.'; end if;
  if p_fulfillment not in ('collection','delivery') then raise exception 'Choose collection or delivery.'; end if;
  if p_fulfillment='delivery' and length(trim(coalesce(p_address,''))) < 5 then raise exception 'Enter a delivery address.'; end if;
  if length(trim(coalesce(p_address,''))) > 500 then raise exception 'Address must be 500 characters or fewer.'; end if;
  if length(trim(coalesce(p_notes,''))) > 1500 then raise exception 'Order notes must be 1500 characters or fewer.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'Your cart is empty.'; end if;
  if jsonb_array_length(p_items)>20 then raise exception 'Too many separate cart lines.'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_slug := v_item->>'slug'; v_size := upper(trim(v_item->>'size'));
    v_quantity := greatest(1,least(99,coalesce((v_item->>'quantity')::integer,1)));
    select * into v_product from public.products where slug=v_slug and status='published';
    if not found then raise exception 'Unknown or unavailable product.'; end if;
    if not (v_size=any(v_product.sizes)) then raise exception 'This size is not available for %.',v_product.name; end if;
    if exists (select 1 from public.product_inventory where product_id=v_product.id and size=v_size and not is_available) then
      raise exception '% in size % is currently unavailable.',v_product.name,v_size;
    end if;

    v_custom := null;
    if v_item ? 'customization' then
      if not v_product.customizable then raise exception 'This product is not customizable.'; end if;
      v_description := trim(coalesce(v_item#>>'{customization,description}',''));
      v_placements := coalesce(v_item#>'{customization,placements}','[]'::jsonb);
      v_artwork := coalesce(v_item#>'{customization,artwork}','[]'::jsonb);
      v_references := coalesce(v_item#>'{customization,references}','[]'::jsonb);
      if length(v_description) < 3 or length(v_description)>2000 then raise exception 'Describe your customization (3–2000 characters).'; end if;
      if jsonb_typeof(v_placements)<>'array' or jsonb_array_length(v_placements)=0 then raise exception 'Choose at least one print placement.'; end if;
      if exists (select 1 from jsonb_array_elements_text(v_placements) x where not (x=any(v_product.customization_placements))) then raise exception 'Invalid customization placement.'; end if;
      if jsonb_typeof(v_artwork)<>'array' or jsonb_array_length(v_artwork)>6 or jsonb_typeof(v_references)<>'array' or jsonb_array_length(v_references)>2 then raise exception 'Too many customization files.'; end if;
      if exists (select 1 from jsonb_array_elements(v_artwork||v_references) f where coalesce(f->>'path','') !~ '^incoming/[0-9a-f-]{36}/[a-z]+-[0-9]+\.(jpg|jpeg|png|webp)$') then raise exception 'Invalid customization file.'; end if;
      v_custom := jsonb_build_object('description',v_description,'placements',v_placements,'artwork',v_artwork,'references',v_references);
    elsif v_product.customizable then
      raise exception 'Add customization details for %.',v_product.name;
    end if;

    v_line := v_product.price*v_quantity; v_subtotal := v_subtotal+v_line;
    v_items := v_items || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'slug',v_product.slug,'name',v_product.name,'color',v_product.color,
      'size',v_size,'quantity',v_quantity,'unitPrice',v_product.price,
      'lineTotal',v_line,'image',v_product.back_url,'customization',v_custom
    )));
  end loop;

  v_email_hash := encode(digest(v_normalized_email,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_email_hash,0));
  delete from private.order_creation_attempts where created_at < now()-interval '24 hours';
  if (select count(*)>=5 from private.order_creation_attempts where email_hash=v_email_hash and created_at>=now()-interval '1 hour') then raise exception 'Too many order attempts. Try again later.'; end if;
  if (select count(*)>=40 from private.order_creation_attempts where created_at>=now()-interval '1 minute') then raise exception 'The order desk is busy. Try again in a minute.'; end if;
  insert into private.order_creation_attempts(email_hash) values(v_email_hash);
  loop
    v_order_number := 'ENSAM-'||to_char(now(),'YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    exit when not exists(select 1 from public.orders where order_number=v_order_number);
  end loop;
  insert into public.orders(order_number,user_id,customer_name,email,phone,fulfillment,address,notes,items,subtotal,delivery_fee,total,claim_token_hash)
  values(v_order_number,v_user_id,trim(p_customer_name),v_normalized_email,trim(p_phone),p_fulfillment,
    case when p_fulfillment='delivery' then trim(p_address) else null end,nullif(trim(coalesce(p_notes,'')),''),v_items,v_subtotal,0,v_subtotal,
    case when v_user_id is null and p_claim_token is not null then encode(digest(p_claim_token,'sha256'),'hex') else null end)
  returning * into v_order;
  return to_jsonb(v_order);
end;
$$;
revoke all on function public.create_store_order(text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.create_store_order(text,text,text,text,text,text,jsonb,text) to anon, authenticated;
