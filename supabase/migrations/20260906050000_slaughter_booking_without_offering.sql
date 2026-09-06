-- A farmer can post slaughter times (availability_slots) before — or without —
-- creating a priced slaughter "offering". Let customers book one of those times
-- directly: a booking now needs an offering/activity OR a slot, not strictly an
-- offering/activity. The farm confirms the animal and price with the customer.
--
-- Idempotent: drops the old check if present, then adds the relaxed one.

alter table public.bookings drop constraint if exists bookings_offering_check;

alter table public.bookings add constraint bookings_offering_check check (
  (booking_type = 'slaughter' and (slaughter_offering_id is not null or slot_id is not null))
  or (booking_type = 'activity' and (activity_id is not null or slot_id is not null))
);

notify pgrst, 'reload schema';
