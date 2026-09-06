-- Let customers see a farm's slaughter / activity times update live while they
-- sit on the farm page: add availability_slots to the realtime publication so
-- Supabase streams inserts, capacity changes, and removals to subscribed
-- clients. RLS still applies to the stream (slots_public_select).
--
-- Safe to re-run: guarded on the publication existing and the table not
-- already being a member.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'availability_slots'
     )
  then
    alter publication supabase_realtime add table public.availability_slots;
  end if;
end;
$$;
