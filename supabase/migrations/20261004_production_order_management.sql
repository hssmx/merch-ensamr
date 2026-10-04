-- Production order management: staff roles, inventory, audit history,
-- customer notifications, internal notes, and saved admin views.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists role text not null default 'customer';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'support', 'fulfillment', 'manager', 'owner'));

update public.profiles
set role = 'owner'
where is_admin and role = 'customer';

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case when is_admin and role = 'customer' then 'owner' else role end
     from public.profiles where id = (select auth.uid())),
    'customer'
  );
$$;

create or replace function public.current_user_has_permission(permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.current_user_role()
    when 'owner' then permission = any(array[
      'orders.read','orders.manage','inventory.read','inventory.manage',
      'products.manage','analytics.read','team.manage'
    ])
    when 'manager' then permission = any(array[
      'orders.read','orders.manage','inventory.read','inventory.manage',
      'products.manage','analytics.read'
    ])
    when 'fulfillment' then permission = any(array[
      'orders.read','orders.manage','inventory.read','inventory.manage'
    ])
    when 'support' then permission = any(array['orders.read','orders.manage'])
    else false
  end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() <> 'customer';
$$;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.current_user_has_permission(text) from public, anon;
revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_has_permission(text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select public.current_user_has_permission('team.manage'))
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

alter table public.products
  add column if not exists stock_tracked boolean not null default false;

alter table public.orders
  add column if not exists inventory_state text not null default 'untracked';
alter table public.orders drop constraint if exists orders_inventory_state_check;
alter table public.orders add constraint orders_inventory_state_check
  check (inventory_state in ('untracked','reserved','committed','released'));

create table if not exists public.product_inventory (
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('S','M','L','XL','XXL')),
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= stock_on_hand),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (product_id, size)
);

insert into public.product_inventory (product_id, size)
select p.id, s.size
from public.products p
cross join lateral unnest(p.sizes) as s(size)
on conflict (product_id, size) do nothing;

create index if not exists product_inventory_stock_idx
  on public.product_inventory(product_id, stock_on_hand, reserved);

alter table public.product_inventory enable row level security;
revoke all on public.product_inventory from anon, authenticated;
grant select, insert, update on public.product_inventory to authenticated;

create policy inventory_staff_read
on public.product_inventory for select to authenticated
using ((select public.current_user_has_permission('inventory.read')));

create policy inventory_staff_insert
on public.product_inventory for insert to authenticated
with check ((select public.current_user_has_permission('inventory.manage')));

create policy inventory_staff_update
on public.product_inventory for update to authenticated
using ((select public.current_user_has_permission('inventory.manage')))
with check ((select public.current_user_has_permission('inventory.manage')));

create or replace function public.manage_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_tracked boolean;
  v_quantity integer;
  v_size text;
  v_available integer;
  v_any_tracked boolean := false;
begin
  if tg_op = 'INSERT' then
    for v_item in select * from jsonb_array_elements(new.items) loop
      select id, stock_tracked into v_product_id, v_tracked
      from public.products where slug = v_item ->> 'slug';
      if coalesce(v_tracked,false) then
        v_any_tracked := true;
        v_quantity := (v_item ->> 'quantity')::integer;
        v_size := upper(v_item ->> 'size');
        select stock_on_hand - reserved into v_available
        from public.product_inventory
        where product_id=v_product_id and size=v_size
        for update;
        if not found or v_available < v_quantity then
          raise exception 'Not enough stock for % in size %.', v_item ->> 'name', v_size;
        end if;
        update public.product_inventory
        set reserved=reserved+v_quantity,updated_at=now()
        where product_id=v_product_id and size=v_size;
      end if;
    end loop;
    new.inventory_state := case when v_any_tracked then 'reserved' else 'untracked' end;
    return new;
  end if;

  if old.inventory_state='reserved' and new.status='cancelled' and old.status is distinct from 'cancelled' then
    for v_item in select * from jsonb_array_elements(new.items) loop
      select id,stock_tracked into v_product_id,v_tracked from public.products where slug=v_item->>'slug';
      if coalesce(v_tracked,false) then
        update public.product_inventory
        set reserved=greatest(0,reserved-(v_item->>'quantity')::integer),updated_at=now()
        where product_id=v_product_id and size=upper(v_item->>'size');
      end if;
    end loop;
    new.inventory_state := 'released';
  elsif old.inventory_state='reserved' and new.status='completed' and old.status is distinct from 'completed' then
    for v_item in select * from jsonb_array_elements(new.items) loop
      select id,stock_tracked into v_product_id,v_tracked from public.products where slug=v_item->>'slug';
      if coalesce(v_tracked,false) then
        update public.product_inventory
        set stock_on_hand=greatest(0,stock_on_hand-(v_item->>'quantity')::integer),
            reserved=greatest(0,reserved-(v_item->>'quantity')::integer),updated_at=now()
        where product_id=v_product_id and size=upper(v_item->>'size');
      end if;
    end loop;
    new.inventory_state := 'committed';
  end if;
  return new;
end;
$$;

revoke all on function public.manage_order_inventory() from public, anon, authenticated;
drop trigger if exists manage_order_inventory_trigger on public.orders;
create trigger manage_order_inventory_trigger
before insert or update of status on public.orders
for each row execute function public.manage_order_inventory();

create table if not exists public.order_activity (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null check (event_type in (
    'order_created','status_changed','payment_changed','fulfillment_updated',
    'customer_update','internal_note','order_claimed','inventory_adjusted'
  )),
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  customer_visible boolean not null default false,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_activity_order_created_idx
  on public.order_activity(order_id, created_at desc);

alter table public.order_activity enable row level security;
revoke all on public.order_activity from anon, authenticated;
grant select, insert on public.order_activity to authenticated;

create policy order_activity_read
on public.order_activity for select to authenticated
using (
  ((select auth.uid()) = (select o.user_id from public.orders o where o.id = order_id)
    and customer_visible)
  or (select public.current_user_has_permission('orders.read'))
);

create policy order_activity_staff_insert
on public.order_activity for insert to authenticated
with check ((select public.current_user_has_permission('orders.manage')));

-- Activity is append-only through audited database functions.
revoke insert, update, delete on public.order_activity from authenticated;

create table if not exists public.internal_order_notes (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists internal_order_notes_order_created_idx
  on public.internal_order_notes(order_id, created_at desc);

alter table public.internal_order_notes enable row level security;
revoke all on public.internal_order_notes from anon, authenticated;
grant select, insert on public.internal_order_notes to authenticated;

create policy internal_notes_staff_read
on public.internal_order_notes for select to authenticated
using ((select public.current_user_has_permission('orders.read')));

create policy internal_notes_staff_insert
on public.internal_order_notes for insert to authenticated
with check (
  (select public.current_user_has_permission('orders.manage'))
  and author_user_id = (select auth.uid())
);

-- Notes are created through admin_update_order so the audit event is inseparable.
revoke insert, update, delete on public.internal_order_notes from authenticated;

create table if not exists public.customer_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  activity_id bigint references public.order_activity(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_notifications_user_created_idx
  on public.customer_notifications(user_id, created_at desc);

alter table public.customer_notifications enable row level security;
revoke all on public.customer_notifications from anon, authenticated;
grant select, update on public.customer_notifications to authenticated;

create policy notifications_owner_read
on public.customer_notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy notifications_owner_update
on public.customer_notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create table if not exists public.admin_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.admin_saved_views enable row level security;
revoke all on public.admin_saved_views from anon, authenticated;
grant select, insert, update, delete on public.admin_saved_views to authenticated;

create policy saved_views_owner_all
on public.admin_saved_views for all to authenticated
using (user_id = (select auth.uid()) and (select public.current_user_has_permission('orders.read')))
with check (user_id = (select auth.uid()) and (select public.current_user_has_permission('orders.read')));

create or replace function public.notify_customer_from_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_order_number text;
begin
  if not new.customer_visible then return new; end if;
  select user_id, order_number into v_user_id, v_order_number
  from public.orders where id = new.order_id;
  if v_user_id is not null then
    insert into public.customer_notifications(user_id, order_id, activity_id, title, message)
    values (
      v_user_id, new.order_id, new.id,
      case when new.event_type = 'status_changed' then 'Order status updated' else 'New order update' end,
      coalesce(new.message, 'Order ' || v_order_number || ' has a new update.')
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_customer_from_activity() from public, anon, authenticated;
drop trigger if exists notify_customer_from_activity_trigger on public.order_activity;
create trigger notify_customer_from_activity_trigger
after insert on public.order_activity
for each row execute function public.notify_customer_from_activity();

create or replace function public.record_new_order_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.order_activity(order_id,event_type,actor_user_id,actor_role,customer_visible,message,created_at)
  values(new.id,'order_created',new.user_id,case when new.user_id is null then null else 'customer' end,true,
    'Order received. The team will review it shortly.',new.created_at);
  return new;
end;
$$;

revoke all on function public.record_new_order_activity() from public, anon, authenticated;
drop trigger if exists record_new_order_activity_trigger on public.orders;
create trigger record_new_order_activity_trigger
after insert on public.orders
for each row execute function public.record_new_order_activity();

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status text,
  p_payment_status text,
  p_payment_method text,
  p_delivery_fee integer,
  p_customer_update text default null,
  p_internal_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.orders;
  v_after public.orders;
  v_actor uuid := auth.uid();
  v_role text := public.current_user_role();
begin
  if v_actor is null or not public.current_user_has_permission('orders.manage') then
    raise exception 'You do not have permission to update orders.';
  end if;
  if p_status not in ('pending_confirmation','awaiting_payment','confirmed','preparing','ready','completed','cancelled') then
    raise exception 'Invalid order status.';
  end if;
  if p_payment_status not in ('unpaid','paid') then raise exception 'Invalid payment status.'; end if;
  if p_payment_method is not null and p_payment_method not in ('cash','bank_transfer') then
    raise exception 'Invalid payment method.';
  end if;
  if p_delivery_fee < 0 then raise exception 'Delivery fee cannot be negative.'; end if;
  if p_status in ('confirmed','preparing','ready','completed') and p_payment_status <> 'paid' then
    raise exception 'Mark the order as paid before moving it into fulfilment.';
  end if;

  select * into v_before from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;

  update public.orders
  set status = p_status,
      payment_status = p_payment_status,
      payment_method = p_payment_method,
      delivery_fee = p_delivery_fee
  where id = p_order_id
  returning * into v_after;

  if v_before.status is distinct from v_after.status then
    insert into public.order_activity(order_id,event_type,from_status,to_status,actor_user_id,actor_role,customer_visible,message)
    values (p_order_id,'status_changed',v_before.status,v_after.status,v_actor,v_role,true,
      'Your order is now ' || replace(v_after.status, '_', ' ') || '.');
  end if;
  if v_before.payment_status is distinct from v_after.payment_status then
    insert into public.order_activity(order_id,event_type,actor_user_id,actor_role,customer_visible,message,metadata)
    values (p_order_id,'payment_changed',v_actor,v_role,true,
      case when v_after.payment_status = 'paid' then 'Payment has been marked as received.' else 'Payment is awaiting confirmation.' end,
      jsonb_build_object('from',v_before.payment_status,'to',v_after.payment_status));
  end if;
  if nullif(trim(coalesce(p_customer_update,'')),'') is not null then
    insert into public.order_activity(order_id,event_type,actor_user_id,actor_role,customer_visible,message)
    values (p_order_id,'customer_update',v_actor,v_role,true,trim(p_customer_update));
  end if;
  if nullif(trim(coalesce(p_internal_note,'')),'') is not null then
    insert into public.internal_order_notes(order_id,author_user_id,body)
    values (p_order_id,v_actor,trim(p_internal_note));
    insert into public.order_activity(order_id,event_type,actor_user_id,actor_role,customer_visible,message)
    values (p_order_id,'internal_note',v_actor,v_role,false,'Internal note added.');
  end if;
  return v_after;
end;
$$;

revoke all on function public.admin_update_order(uuid,text,text,text,integer,text,text) from public, anon;
grant execute on function public.admin_update_order(uuid,text,text,text,integer,text,text) to authenticated;

create or replace function public.admin_bulk_update_orders(
  p_order_ids uuid[],
  p_status text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_order public.orders;
  v_count integer := 0;
begin
  if auth.uid() is null or not public.current_user_has_permission('orders.manage') then
    raise exception 'You do not have permission to update orders.';
  end if;
  if coalesce(cardinality(p_order_ids), 0) = 0 then return 0; end if;
  if cardinality(p_order_ids) > 100 then raise exception 'Select at most 100 orders.'; end if;
  foreach v_id in array p_order_ids loop
    select * into v_order from public.orders where id = v_id;
    if found then
      perform public.admin_update_order(
        v_id, p_status, v_order.payment_status, v_order.payment_method,
        v_order.delivery_fee, null, null
      );
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.admin_bulk_update_orders(uuid[],text) from public, anon;
grant execute on function public.admin_bulk_update_orders(uuid[],text) to authenticated;

create or replace function public.admin_set_inventory(
  p_product_id uuid,
  p_size text,
  p_stock_on_hand integer,
  p_low_stock_threshold integer,
  p_stock_tracked boolean
)
returns public.product_inventory
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.product_inventory;
begin
  if not public.current_user_has_permission('inventory.manage') then
    raise exception 'You do not have permission to manage inventory.';
  end if;
  if p_stock_on_hand < 0 or p_low_stock_threshold < 0 then raise exception 'Stock values cannot be negative.'; end if;
  if p_size not in ('S','M','L','XL','XXL') then raise exception 'Invalid size.'; end if;
  update public.products set stock_tracked = p_stock_tracked where id = p_product_id;
  insert into public.product_inventory(product_id,size,stock_on_hand,low_stock_threshold,updated_by,updated_at)
  values(p_product_id,p_size,p_stock_on_hand,p_low_stock_threshold,auth.uid(),now())
  on conflict(product_id,size) do update set
    stock_on_hand = excluded.stock_on_hand,
    low_stock_threshold = excluded.low_stock_threshold,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.admin_set_inventory(uuid,text,integer,integer,boolean) from public, anon;
grant execute on function public.admin_set_inventory(uuid,text,integer,integer,boolean) to authenticated;

create or replace function public.admin_set_staff_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare v_profile public.profiles;
begin
  if not public.current_user_has_permission('team.manage') then
    raise exception 'Only an owner can manage team roles.';
  end if;
  if p_role not in ('customer','support','fulfillment','manager','owner') then raise exception 'Invalid role.'; end if;
  if p_user_id = auth.uid() and p_role <> 'owner' then
    raise exception 'Owners cannot remove their own owner access.';
  end if;
  update public.profiles set role=p_role,is_admin=(p_role<>'customer') where id=p_user_id returning * into v_profile;
  if not found then raise exception 'Profile not found.'; end if;
  return v_profile;
end;
$$;

revoke all on function public.admin_set_staff_role(uuid,text) from public, anon;
grant execute on function public.admin_set_staff_role(uuid,text) to authenticated;

drop policy if exists orders_select_owner_or_admin on public.orders;
create policy orders_select_owner_or_staff
on public.orders for select to authenticated
using (
  user_id = (select auth.uid())
  or (select public.current_user_has_permission('orders.read'))
);

drop policy if exists orders_update_admin on public.orders;
create policy orders_update_staff
on public.orders for update to authenticated
using ((select public.current_user_has_permission('orders.manage')))
with check ((select public.current_user_has_permission('orders.manage')));

-- All order mutations go through admin_update_order/admin_bulk_update_orders.
revoke update on public.orders from authenticated;

drop policy if exists products_read_authenticated on public.products;
create policy products_read_authenticated
on public.products for select to authenticated
using (status = 'published' or (select public.current_user_has_permission('products.manage')));

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products for insert to authenticated
with check ((select public.current_user_has_permission('products.manage')) and created_by=(select auth.uid()));
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products for update to authenticated
using ((select public.current_user_has_permission('products.manage')))
with check ((select public.current_user_has_permission('products.manage')));
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products for delete to authenticated
using ((select public.current_user_has_permission('products.manage')));

insert into public.order_activity(order_id,event_type,customer_visible,message,created_at)
select id,'order_created',true,'Order received. The team will review it shortly.',created_at
from public.orders o
where not exists (
  select 1 from public.order_activity a where a.order_id=o.id and a.event_type='order_created'
);

create or replace function public.claim_guest_orders(p_claim_tokens text[])
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_claimed integer := 0;
  v_order_id uuid;
begin
  if v_user_id is null then raise exception 'Sign in first.'; end if;
  for v_order_id in
    update public.orders
    set user_id=v_user_id,claim_token_hash=null,updated_at=now()
    where user_id is null and claim_token_hash in (
      select encode(digest(token,'sha256'),'hex') from unnest(p_claim_tokens) token where length(token)>=16
    )
    returning id
  loop
    v_claimed := v_claimed + 1;
    insert into public.order_activity(order_id,event_type,actor_user_id,actor_role,customer_visible,message)
    values(v_order_id,'order_claimed',v_user_id,'customer',true,'This guest order is now linked to your account.');
  end loop;
  return jsonb_build_object('claimed',v_claimed);
end;
$$;

revoke all on function public.claim_guest_orders(text[]) from public, anon;
grant execute on function public.claim_guest_orders(text[]) to authenticated;

-- Trigger functions are not APIs.
revoke all on function public.touch_product_updated_at() from public, anon, authenticated;
