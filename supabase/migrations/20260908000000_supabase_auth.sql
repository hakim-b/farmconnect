-- Replace Clerk third-party JWT identity with native Supabase Auth.
-- profiles.id stays a bigint (farms/bookings already FK to it). The Clerk
-- user id becomes auth_user_id uuid, matching auth.users(id) / auth.uid().
-- Seed vendor rows keep a null auth_user_id so demo farms stay public.
--
-- LANGUAGE SQL helpers were inlined into some RLS policies, so those
-- policies must be dropped before clerk_user_id can go.

begin;

alter table public.profiles
  add column if not exists auth_user_id uuid;

alter table public.profiles
  drop constraint if exists profiles_auth_user_id_key;

alter table public.profiles
  add constraint profiles_auth_user_id_key unique (auth_user_id);

drop policy if exists bookings_select on public.bookings;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create or replace function private.current_profile_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_vendor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = (select auth.uid())
      and p.role = 'vendor'
  );
$$;

create or replace function private.owns_farm(p_farm_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farms f
    join public.profiles p on p.id = f.owner_profile_id
    where f.id = p_farm_id
      and p.auth_user_id = (select auth.uid())
  );
$$;

create or replace function private.can_view_booking(p_booking_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings b
    left join public.profiles owner_profile
      on owner_profile.id = (
        select f.owner_profile_id from public.farms f where f.id = b.farm_id
      )
    where b.id = p_booking_id
      and (
        exists (
          select 1
          from public.profiles p
          where p.id = b.customer_profile_id
            and p.auth_user_id = (select auth.uid())
        )
        or owner_profile.auth_user_id = (select auth.uid())
        or exists (
          select 1
          from public.booking_invitees i
          join public.profiles p on p.id = i.invitee_profile_id
          where i.booking_id = b.id
            and p.auth_user_id = (select auth.uid())
        )
      )
  );
$$;

drop function if exists private.clerk_user_id();

alter table public.profiles
  drop column if exists clerk_user_id;

create policy profiles_insert_own on public.profiles
for insert
to authenticated
with check (auth_user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
for update
to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

create policy bookings_select on public.bookings
for select
to authenticated
using ((select private.can_view_booking(id)));

alter table public.profiles
  drop constraint if exists profiles_auth_user_id_fkey;

alter table public.profiles
  add constraint profiles_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users (id) on delete cascade;

notify pgrst, 'reload schema';

commit;
