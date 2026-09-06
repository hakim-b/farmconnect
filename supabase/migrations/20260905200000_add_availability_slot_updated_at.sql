-- Keep existing databases compatible with slot capacity reservation triggers.
alter table public.availability_slots
add column if not exists updated_at timestamptz not null default now();
