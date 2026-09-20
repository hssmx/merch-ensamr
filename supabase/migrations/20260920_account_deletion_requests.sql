create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'completed', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_deletion_requests_one_open_per_user
  on public.account_deletion_requests(user_id)
  where status in ('pending', 'in_review');

alter table public.account_deletion_requests enable row level security;

revoke all on table public.account_deletion_requests from public, anon;
grant select, insert, update on table public.account_deletion_requests to authenticated;

drop policy if exists "Users can read own deletion requests" on public.account_deletion_requests;
create policy "Users can read own deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or public.current_user_is_admin()
);

drop policy if exists "Users can create own deletion requests" on public.account_deletion_requests;
create policy "Users can create own deletion requests"
on public.account_deletion_requests
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can update deletion requests" on public.account_deletion_requests;
create policy "Admins can update deletion requests"
on public.account_deletion_requests
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create or replace function public.touch_account_deletion_request_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_account_deletion_request_updated_at()
from public, anon, authenticated;

drop trigger if exists account_deletion_requests_updated_at
on public.account_deletion_requests;

create trigger account_deletion_requests_updated_at
before update on public.account_deletion_requests
for each row
execute function public.touch_account_deletion_request_updated_at();
