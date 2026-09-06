-- FarmConnect marketplace schema.
-- Clerk is the identity provider. RLS keys off auth.jwt()->>'sub' (Clerk user id).

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table public.profiles (
  id bigint generated always as identity primary key,
  clerk_user_id text not null unique,
  role text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('customer', 'vendor'))
);

create table public.farms (
  id bigint generated always as identity primary key,
  owner_profile_id bigint not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  farm_type text not null,
  thumbnail_url text,
  address_line text,
  city text,
  region text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  average_rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  is_published boolean not null default false,
  eid_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farms_type_check check (
    farm_type in ('slaughter_only', 'produce_and_meats', 'mixed')
  ),
  constraint farms_rating_check check (average_rating >= 0 and average_rating <= 5)
);

create table public.farm_certifications (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  label text not null,
  document_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint farm_certifications_unique unique (farm_id, label)
);

create table public.products (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  category text not null,
  name text not null,
  description text,
  image_url text,
  pricing_type text not null,
  unit text not null default 'item',
  price numeric(10, 2) not null,
  sale_price numeric(10, 2),
  is_on_sale boolean not null default false,
  stock_quantity numeric(12, 3),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_category_check check (category in ('produce', 'meat')),
  constraint products_pricing_type_check check (pricing_type in ('weight', 'fixed')),
  constraint products_price_check check (price >= 0),
  constraint products_sale_price_check check (sale_price is null or sale_price >= 0)
);

create table public.activities (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric(10, 2) not null default 0,
  duration_minutes integer,
  max_guests integer,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_price_check check (price >= 0)
);

create table public.slaughter_offerings (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  animal_type text not null,
  name text not null,
  description text,
  image_url text,
  price numeric(10, 2) not null,
  yield_notes text,
  max_split_participants integer not null default 4,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slaughter_price_check check (price >= 0),
  constraint slaughter_split_check check (max_split_participants >= 1)
);

create table public.availability_slots (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  slot_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 1,
  remaining integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint availability_slot_type_check check (slot_type in ('slaughter', 'activity')),
  constraint availability_time_check check (ends_at > starts_at),
  constraint availability_capacity_check check (capacity >= 0 and remaining >= 0)
);

create table public.bookings (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  customer_profile_id bigint not null references public.profiles (id) on delete cascade,
  booking_type text not null,
  slaughter_offering_id bigint references public.slaughter_offerings (id) on delete set null,
  activity_id bigint references public.activities (id) on delete set null,
  slot_id bigint references public.availability_slots (id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'pending',
  total_price numeric(10, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_type_check check (booking_type in ('slaughter', 'activity')),
  constraint bookings_status_check check (
    status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')
  ),
  constraint bookings_offering_check check (
    (booking_type = 'slaughter' and slaughter_offering_id is not null)
    or (booking_type = 'activity' and activity_id is not null)
  )
);

create table public.booking_invitees (
  id bigint generated always as identity primary key,
  booking_id bigint not null references public.bookings (id) on delete cascade,
  invitee_profile_id bigint references public.profiles (id) on delete set null,
  invitee_email text,
  share_count integer not null default 1,
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  constraint booking_invitees_status_check check (
    status in ('invited', 'accepted', 'declined')
  ),
  constraint booking_invitees_contact_check check (
    invitee_profile_id is not null or invitee_email is not null
  )
);

create sequence if not exists public.eid_ticket_seq;

create table public.eid_registrations (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  customer_profile_id bigint not null references public.profiles (id) on delete cascade,
  ticket_number text not null unique default concat(
    'EID-',
    lpad(nextval('public.eid_ticket_seq')::text, 6, '0')
  ),
  animal_type text not null,
  status text not null default 'registered',
  assigned_slot_id bigint references public.availability_slots (id) on delete set null,
  assigned_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eid_status_check check (
    status in ('registered', 'assigned', 'completed', 'cancelled')
  ),
  constraint eid_registrations_unique unique (farm_id, customer_profile_id, animal_type)
);

create table public.reviews (
  id bigint generated always as identity primary key,
  farm_id bigint not null references public.farms (id) on delete cascade,
  author_profile_id bigint not null references public.profiles (id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint reviews_rating_check check (rating >= 1 and rating <= 5),
  constraint reviews_unique unique (farm_id, author_profile_id)
);

create or replace function private.clerk_user_id()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif((select auth.jwt() ->> 'sub'), '');
$$;

create or replace function private.current_profile_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.clerk_user_id = (select auth.jwt() ->> 'sub')
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
    where p.clerk_user_id = (select auth.jwt() ->> 'sub')
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
      and p.clerk_user_id = (select auth.jwt() ->> 'sub')
  );
$$;

create or replace function private.farm_is_published(p_farm_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farms f
    where f.id = p_farm_id
      and f.is_published = true
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
            and p.clerk_user_id = (select auth.jwt() ->> 'sub')
        )
        or owner_profile.clerk_user_id = (select auth.jwt() ->> 'sub')
        or exists (
          select 1
          from public.booking_invitees i
          join public.profiles p on p.id = i.invitee_profile_id
          where i.booking_id = b.id
            and p.clerk_user_id = (select auth.jwt() ->> 'sub')
        )
      )
  );
$$;

create index farms_owner_profile_id_idx on public.farms (owner_profile_id);
create index farms_published_idx on public.farms (is_published) where is_published = true;
create index farm_certifications_farm_id_idx on public.farm_certifications (farm_id);
create index products_farm_id_idx on public.products (farm_id);
create index products_on_sale_idx on public.products (is_on_sale) where is_on_sale = true;
create index activities_farm_id_idx on public.activities (farm_id);
create index slaughter_offerings_farm_id_idx on public.slaughter_offerings (farm_id);
create index availability_slots_farm_id_idx on public.availability_slots (farm_id);
create index availability_slots_starts_at_idx on public.availability_slots (starts_at);
create index bookings_farm_id_idx on public.bookings (farm_id);
create index bookings_customer_profile_id_idx on public.bookings (customer_profile_id);
create index bookings_status_idx on public.bookings (status);
create index booking_invitees_booking_id_idx on public.booking_invitees (booking_id);
create index eid_registrations_farm_id_idx on public.eid_registrations (farm_id);
create index eid_registrations_customer_profile_id_idx on public.eid_registrations (customer_profile_id);
create index reviews_farm_id_idx on public.reviews (farm_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger farms_set_updated_at
before update on public.farms
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

create trigger slaughter_offerings_set_updated_at
before update on public.slaughter_offerings
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create trigger eid_registrations_set_updated_at
before update on public.eid_registrations
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_certifications enable row level security;
alter table public.products enable row level security;
alter table public.activities enable row level security;
alter table public.slaughter_offerings enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_invitees enable row level security;
alter table public.eid_registrations enable row level security;
alter table public.reviews enable row level security;

create policy profiles_select on public.profiles
for select
to anon, authenticated
using (true);

create policy profiles_insert_own on public.profiles
for insert
to authenticated
with check (clerk_user_id = (select private.clerk_user_id()));

create policy profiles_update_own on public.profiles
for update
to authenticated
using (clerk_user_id = (select private.clerk_user_id()))
with check (clerk_user_id = (select private.clerk_user_id()));

create policy farms_public_select on public.farms
for select
to anon, authenticated
using (
  is_published = true
  or (select private.owns_farm(id))
);

create policy farms_vendor_insert on public.farms
for insert
to authenticated
with check (
  owner_profile_id = (select private.current_profile_id())
  and (select private.is_vendor())
);

create policy farms_vendor_update on public.farms
for update
to authenticated
using ((select private.owns_farm(id)))
with check ((select private.owns_farm(id)));

create policy farms_vendor_delete on public.farms
for delete
to authenticated
using ((select private.owns_farm(id)));

create policy farm_certifications_public_select on public.farm_certifications
for select
to anon, authenticated
using (
  (select private.farm_is_published(farm_id))
  or (select private.owns_farm(farm_id))
);

create policy farm_certifications_vendor_insert on public.farm_certifications
for insert
to authenticated
with check ((select private.owns_farm(farm_id)));

create policy farm_certifications_vendor_update on public.farm_certifications
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy farm_certifications_vendor_delete on public.farm_certifications
for delete
to authenticated
using ((select private.owns_farm(farm_id)));

create policy products_public_select on public.products
for select
to anon, authenticated
using (
  (select private.farm_is_published(farm_id))
  or (select private.owns_farm(farm_id))
);

create policy products_vendor_insert on public.products
for insert
to authenticated
with check ((select private.owns_farm(farm_id)));

create policy products_vendor_update on public.products
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy products_vendor_delete on public.products
for delete
to authenticated
using ((select private.owns_farm(farm_id)));

create policy activities_public_select on public.activities
for select
to anon, authenticated
using (
  (select private.farm_is_published(farm_id))
  or (select private.owns_farm(farm_id))
);

create policy activities_vendor_insert on public.activities
for insert
to authenticated
with check ((select private.owns_farm(farm_id)));

create policy activities_vendor_update on public.activities
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy activities_vendor_delete on public.activities
for delete
to authenticated
using ((select private.owns_farm(farm_id)));

create policy slaughter_public_select on public.slaughter_offerings
for select
to anon, authenticated
using (
  (select private.farm_is_published(farm_id))
  or (select private.owns_farm(farm_id))
);

create policy slaughter_vendor_insert on public.slaughter_offerings
for insert
to authenticated
with check ((select private.owns_farm(farm_id)));

create policy slaughter_vendor_update on public.slaughter_offerings
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy slaughter_vendor_delete on public.slaughter_offerings
for delete
to authenticated
using ((select private.owns_farm(farm_id)));

create policy slots_public_select on public.availability_slots
for select
to anon, authenticated
using (
  (select private.farm_is_published(farm_id))
  or (select private.owns_farm(farm_id))
);

create policy slots_vendor_insert on public.availability_slots
for insert
to authenticated
with check ((select private.owns_farm(farm_id)));

create policy slots_vendor_update on public.availability_slots
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy slots_vendor_delete on public.availability_slots
for delete
to authenticated
using ((select private.owns_farm(farm_id)));

create policy bookings_select on public.bookings
for select
to authenticated
using ((select private.can_view_booking(id)));

create policy bookings_customer_insert on public.bookings
for insert
to authenticated
with check (
  customer_profile_id = (select private.current_profile_id())
  and (select private.farm_is_published(farm_id))
);

create policy bookings_customer_update on public.bookings
for update
to authenticated
using (customer_profile_id = (select private.current_profile_id()))
with check (customer_profile_id = (select private.current_profile_id()));

create policy bookings_vendor_update on public.bookings
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy booking_invitees_select on public.booking_invitees
for select
to authenticated
using ((select private.can_view_booking(booking_id)));

create policy booking_invitees_insert on public.booking_invitees
for insert
to authenticated
with check ((select private.can_view_booking(booking_id)));

create policy booking_invitees_update on public.booking_invitees
for update
to authenticated
using ((select private.can_view_booking(booking_id)))
with check ((select private.can_view_booking(booking_id)));

create policy eid_select on public.eid_registrations
for select
to authenticated
using (
  customer_profile_id = (select private.current_profile_id())
  or (select private.owns_farm(farm_id))
);

create policy eid_customer_insert on public.eid_registrations
for insert
to authenticated
with check (
  customer_profile_id = (select private.current_profile_id())
  and (select private.farm_is_published(farm_id))
);

create policy eid_customer_update on public.eid_registrations
for update
to authenticated
using (customer_profile_id = (select private.current_profile_id()))
with check (customer_profile_id = (select private.current_profile_id()));

create policy eid_vendor_update on public.eid_registrations
for update
to authenticated
using ((select private.owns_farm(farm_id)))
with check ((select private.owns_farm(farm_id)));

create policy reviews_public_select on public.reviews
for select
to anon, authenticated
using (
  (select private.farm_is_published(farm_id))
  or (select private.owns_farm(farm_id))
);

create policy reviews_customer_insert on public.reviews
for insert
to authenticated
with check (author_profile_id = (select private.current_profile_id()));

create policy reviews_author_update on public.reviews
for update
to authenticated
using (author_profile_id = (select private.current_profile_id()))
with check (author_profile_id = (select private.current_profile_id()));

grant usage on schema public to anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.clerk_user_id() to anon, authenticated;
grant execute on function private.current_profile_id() to anon, authenticated;
grant execute on function private.is_vendor() to anon, authenticated;
grant execute on function private.owns_farm(bigint) to anon, authenticated;
grant execute on function private.farm_is_published(bigint) to anon, authenticated;
grant execute on function private.can_view_booking(bigint) to authenticated;

revoke all on function private.clerk_user_id() from public;
revoke all on function private.current_profile_id() from public;
revoke all on function private.is_vendor() from public;
revoke all on function private.owns_farm(bigint) from public;
revoke all on function private.farm_is_published(bigint) from public;
revoke all on function private.can_view_booking(bigint) from public;

grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

grant select on table public.farms to anon, authenticated;
grant insert, update, delete on table public.farms to authenticated;

grant select on table public.farm_certifications to anon, authenticated;
grant insert, update, delete on table public.farm_certifications to authenticated;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

grant select on table public.activities to anon, authenticated;
grant insert, update, delete on table public.activities to authenticated;

grant select on table public.slaughter_offerings to anon, authenticated;
grant insert, update, delete on table public.slaughter_offerings to authenticated;

grant select on table public.availability_slots to anon, authenticated;
grant insert, update, delete on table public.availability_slots to authenticated;

grant select, insert, update on table public.bookings to authenticated;
grant select, insert, update on table public.booking_invitees to authenticated;
grant select, insert, update on table public.eid_registrations to authenticated;

grant select on table public.reviews to anon, authenticated;
grant insert, update on table public.reviews to authenticated;

grant usage, select on all sequences in schema public to authenticated;
grant usage, select on sequence public.eid_ticket_seq to authenticated;

notify pgrst, 'reload schema';
