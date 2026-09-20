create schema if not exists private;

revoke execute on function public.claim_guest_orders(text[]) from anon;
revoke execute on function public.current_user_is_admin() from anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_order_total() from public, anon, authenticated;

alter function public.sync_order_total() set search_path = public;

grant execute on function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) to anon, authenticated;

grant execute on function public.claim_guest_orders(text[]) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
