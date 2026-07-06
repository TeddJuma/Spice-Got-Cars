-- Profiles table (auto-created on signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'owner' check (role in ('owner')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Owners can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Owners can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  trim text,
  year integer not null check (year >= 1900 and year <= extract(year from current_date) + 1),
  price_kes integer not null check (price_kes > 0),
  negotiable boolean default false,
  mileage_km integer not null check (mileage_km >= 0),
  transmission text not null check (transmission in ('Automatic', 'Manual')),
  fuel_type text not null,
  engine_size text not null,
  body_type text not null,
  condition text not null check (condition in ('New', 'Foreign Used', 'Locally Used')),
  description text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  ntsa_inspected boolean default false,
  logbook_verified boolean default false,
  listed_at date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Public listings are viewable by everyone"
  on public.listings for select
  to public
  using (true);

create policy "Owners can insert listings"
  on public.listings for insert
  to authenticated
  with check (true);

create policy "Owners can update listings"
  on public.listings for update
  to authenticated
  using (true);

create policy "Owners can delete listings"
  on public.listings for delete
  to authenticated
  using (true);

-- Update updated_at on change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute procedure public.handle_updated_at();

-- Listing photos table
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  storage_path text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.listing_photos enable row level security;

create policy "Public listing_photos are viewable by everyone"
  on public.listing_photos for select
  to public
  using (true);

create policy "Owners can insert listing_photos"
  on public.listing_photos for insert
  to authenticated
  with check (true);

create policy "Owners can update listing_photos"
  on public.listing_photos for update
  to authenticated
  using (true);

create policy "Owners can delete listing_photos"
  on public.listing_photos for delete
  to authenticated
  using (true);

-- Storage bucket: car-photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'car-photos',
  'car-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "Public car-photos are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'car-photos');

create policy "Owners can upload car-photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-photos');

create policy "Owners can update car-photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'car-photos');

create policy "Owners can delete car-photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-photos');
