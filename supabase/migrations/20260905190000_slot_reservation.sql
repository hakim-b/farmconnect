-- FarmConnect: slot capacity reservation.
--
-- Ensures bookings and Eid assignments never oversell an availability slot:
--   * a booking that references a slot reserves one unit of capacity
--   * a booking cancelled/declined releases that unit
--   * assigning an Eid ticket to a slot reserves one unit
--   * cancelling an assigned Eid ticket releases it
--
-- All helpers live in the `private` schema and are security definer so they
-- can adjust `remaining` regardless of the calling role's RLS policy. Re-runs
-- are safe (functions use `create or replace`, triggers are dropped first).

create or replace function private.reserve_slot_capacity(
  p_farm_id bigint,
  p_slot_id bigint,
  p_slot_type text,
  p_delta integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot public.availability_slots%rowtype;
begin
  if p_slot_id is null or p_delta = 0 then
    return;
  end if;

  select * into v_slot
  from public.availability_slots
  where id = p_slot_id
  for update;

  if not found then
    raise exception 'slot_does_not_exist';
  end if;
  if v_slot.farm_id <> p_farm_id then
    raise exception 'slot_belongs_to_another_farm';
  end if;
  if v_slot.slot_type <> p_slot_type then
    raise exception 'slot_type_mismatch';
  end if;
  if p_delta > 0 and v_slot.remaining < p_delta then
    raise exception 'slot_full';
  end if;

  update public.availability_slots
  set remaining = remaining - p_delta,
      updated_at = now()
  where id = p_slot_id;
end;
$$;

create or replace function private.bookings_reserve_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.reserve_slot_capacity(new.farm_id, new.slot_id, new.booking_type, 1);
  return new;
end;
$$;

create or replace function private.bookings_release_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.slot_id is not null
     and new.status in ('cancelled', 'declined')
     and old.status not in ('cancelled', 'declined')
  then
    perform private.reserve_slot_capacity(new.farm_id, new.slot_id, new.booking_type, -1);
  end if;
  return new;
end;
$$;

create or replace function private.eid_assign_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assigned_slot_id is distinct from old.assigned_slot_id then
    if new.assigned_slot_id is not null
       and new.assigned_slot_id <> old.assigned_slot_id
    then
      perform private.reserve_slot_capacity(new.farm_id, new.assigned_slot_id, 'slaughter', 1);
    end if;
    if old.assigned_slot_id is not null
       and old.assigned_slot_id is distinct from new.assigned_slot_id
    then
      perform private.reserve_slot_capacity(new.farm_id, old.assigned_slot_id, 'slaughter', -1);
    end if;
  end if;

  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and new.assigned_slot_id is not null then
    perform private.reserve_slot_capacity(new.farm_id, new.assigned_slot_id, 'slaughter', -1);
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_reserve_slot on public.bookings;
create trigger bookings_reserve_slot
before insert on public.bookings
for each row execute function private.bookings_reserve_slot();

drop trigger if exists bookings_release_slot on public.bookings;
create trigger bookings_release_slot
after update of status on public.bookings
for each row execute function private.bookings_release_slot();

drop trigger if exists eid_assign_slot on public.eid_registrations;
create trigger eid_assign_slot
before insert or update of assigned_slot_id, status on public.eid_registrations
for each row execute function private.eid_assign_slot();