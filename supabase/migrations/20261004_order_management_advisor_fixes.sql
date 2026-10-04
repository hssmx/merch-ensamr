create index if not exists customer_notifications_order_idx
  on public.customer_notifications(order_id);
create index if not exists customer_notifications_activity_idx
  on public.customer_notifications(activity_id);
create index if not exists internal_order_notes_author_idx
  on public.internal_order_notes(author_user_id);
create index if not exists order_activity_actor_idx
  on public.order_activity(actor_user_id);
create index if not exists product_inventory_updated_by_idx
  on public.product_inventory(updated_by);
