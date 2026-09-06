-- Split names on profiles. Customers edit a first and last name from the
-- profile panel; display_name stays the single value the rest of the app shows
-- (farmers see it on bookings and reviews) and is kept in sync by the client.
--
-- Avatars reuse the public `item-photos` storage bucket.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

notify pgrst, 'reload schema';
