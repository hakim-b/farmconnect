-- Storage bucket for vendor item photos (produce, meat, animals, activities).
-- Run this once in the Supabase dashboard → SQL Editor.

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- Anyone can view photos (the customer feed needs them).
drop policy if exists "item photos public read" on storage.objects;
create policy "item photos public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'item-photos');

-- Any signed-in user can add / replace / remove photos in this bucket.
-- (Hackathon-simple: not scoped to farm ownership. Tighten before production.)
drop policy if exists "item photos write" on storage.objects;
create policy "item photos write"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'item-photos');

drop policy if exists "item photos update" on storage.objects;
create policy "item photos update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'item-photos')
  with check (bucket_id = 'item-photos');

drop policy if exists "item photos delete" on storage.objects;
create policy "item photos delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'item-photos');
