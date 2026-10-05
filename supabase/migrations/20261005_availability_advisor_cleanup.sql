-- The public availability policy already covers signed-in staff reads.
drop policy if exists inventory_staff_read on public.product_inventory;

-- Retire the obsolete quantity-based admin API now that inventory is boolean.
revoke all on function public.admin_set_inventory(uuid,text,integer,integer,boolean)
  from public, anon, authenticated;
drop function if exists public.admin_set_inventory(uuid,text,integer,integer,boolean);
