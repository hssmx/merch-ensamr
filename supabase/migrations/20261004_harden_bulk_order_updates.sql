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
