-- Customization is optional, and only cancelled orders may be permanently removed.
create or replace function public.admin_delete_cancelled_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_permission('orders.manage') then
    raise exception 'You do not have permission to delete orders.';
  end if;
  if not exists (select 1 from public.orders where id=p_order_id and status='cancelled') then
    raise exception 'Only cancelled orders can be deleted.';
  end if;
  delete from public.orders where id=p_order_id and status='cancelled';
  return found;
end;
$$;
revoke all on function public.admin_delete_cancelled_order(uuid) from public, anon;
grant execute on function public.admin_delete_cancelled_order(uuid) to authenticated;

-- create_store_order previously rejected customizable products without a brief.
-- Replace just that final requirement while keeping validation when a brief is sent.
do $$
declare v_definition text;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='create_store_order'
    and pg_get_function_identity_arguments(p.oid)='p_customer_name text, p_email text, p_phone text, p_fulfillment text, p_address text, p_notes text, p_items jsonb, p_claim_token text';
  v_definition := replace(v_definition,
    E'    elsif v_product.customizable then\n      raise exception ''Add customization details for %.'',v_product.name;\n    end if;',
    E'    end if;');
  execute v_definition;
end;
$$;
