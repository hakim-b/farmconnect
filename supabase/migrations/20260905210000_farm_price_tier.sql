-- FarmConnect: a real price tier for the map / discovery filters.
--
-- `farms.price_tier` is a 1-3 bucket ($ / $$ / $$$) computed from the farm's
-- cheapest available offering across products, activities, and slaughter
-- offerings. A trigger keeps it current so the client can filter and label
-- farms from the column instead of guessing from `farm_type`.

alter table public.farms
  add column if not exists price_tier smallint not null default 2;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'farms_price_tier_check'
  ) then
    alter table public.farms
      add constraint farms_price_tier_check check (price_tier between 1 and 3);
  end if;
end;
$$;

create or replace function private.farm_price_tier(p_farm_id bigint)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  with prices as (
    select price from public.products
      where farm_id = p_farm_id and is_available and price > 0
    union all
    select price from public.activities
      where farm_id = p_farm_id and is_available and price > 0
    union all
    select price from public.slaughter_offerings
      where farm_id = p_farm_id and is_available and price > 0
  )
  select case
    when min(price) is null then 2
    when min(price) < 25 then 1
    when min(price) < 75 then 2
    else 3
  end::smallint
  from prices;
$$;

revoke all on function private.farm_price_tier(bigint) from public;

create or replace function private.sync_farm_price_tier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_farm_id bigint := coalesce(new.farm_id, old.farm_id);
begin
  update public.farms
    set price_tier = private.farm_price_tier(v_farm_id),
        updated_at = now()
  where id = v_farm_id
    and price_tier is distinct from private.farm_price_tier(v_farm_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists products_sync_price_tier on public.products;
create trigger products_sync_price_tier
after insert or delete or update of price, is_available on public.products
for each row execute function private.sync_farm_price_tier();

drop trigger if exists activities_sync_price_tier on public.activities;
create trigger activities_sync_price_tier
after insert or delete or update of price, is_available on public.activities
for each row execute function private.sync_farm_price_tier();

drop trigger if exists slaughter_sync_price_tier on public.slaughter_offerings;
create trigger slaughter_sync_price_tier
after insert or delete or update of price, is_available on public.slaughter_offerings
for each row execute function private.sync_farm_price_tier();

-- Backfill existing farms.
update public.farms f set price_tier = private.farm_price_tier(f.id);
