-- Add location fields to listings
alter table public.listings
  add column if not exists location text,
  add column if not exists location_pin text;
