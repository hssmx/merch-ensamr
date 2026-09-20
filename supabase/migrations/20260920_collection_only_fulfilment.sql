alter table public.orders
  drop constraint if exists orders_fulfillment_check,
  drop constraint if exists orders_delivery_fee_check;

alter table public.orders
  add constraint orders_fulfillment_check
    check (fulfillment = 'collection'),
  add constraint orders_delivery_fee_check
    check (delivery_fee = 0),
  add constraint orders_collection_address_check
    check (address is null);

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
  if p_fulfillment <> 'collection' then
    raise exception 'Collection at ENSAM Rabat is the only fulfilment option.';
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
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
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
    'collection',
    null,
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
$$;

revoke all on function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) from public;
grant execute on function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) to anon, authenticated;
