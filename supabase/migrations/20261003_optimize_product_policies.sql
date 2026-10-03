create index if not exists products_created_by_idx on public.products(created_by);

drop policy if exists "products_read_published" on public.products;
drop policy if exists "products_admin_read_all" on public.products;

create policy "products_read_published_anon"
on public.products for select
to anon
using (status = 'published');

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
