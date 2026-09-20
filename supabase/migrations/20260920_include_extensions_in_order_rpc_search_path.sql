alter function public.create_store_order(
  text, text, text, text, text, text, jsonb, text
) set search_path = public, extensions;

alter function public.claim_guest_orders(text[])
set search_path = public, extensions;
