-- Farm profile photos. Farmers add a few pictures of the farm during setup;
-- the customer farm page shows them as a gallery. Stored as an ordered list of
-- public URLs; photo_urls[1] doubles as the card thumbnail.
--
-- Photos live in the existing public `item-photos` storage bucket (created in
-- 20260906000000_item_photos.sql); this migration re-creates the bucket + read
-- policy defensively in case that one hasn't been run.

alter table public.farms
  add column if not exists photo_urls text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "item photos public read" on storage.objects;
create policy "item photos public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'item-photos');

drop policy if exists "item photos write" on storage.objects;
create policy "item photos write"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'item-photos');

notify pgrst, 'reload schema';
