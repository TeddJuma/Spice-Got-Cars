-- Create inquiries table for public car inquiries
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz default now()
);

alter table public.inquiries enable row level security;

-- Anyone (anon + authenticated) can insert inquiries
drop policy if exists "Public inquiries are insertable by everyone" on public.inquiries;
create policy "Public inquiries are insertable by everyone"
  on public.inquiries for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users (admins) can read/delete inquiries
drop policy if exists "Admins can read inquiries" on public.inquiries;
create policy "Admins can read inquiries"
  on public.inquiries for select
  to authenticated
  using (true);

drop policy if exists "Admins can delete inquiries" on public.inquiries;
create policy "Admins can delete inquiries"
  on public.inquiries for delete
  to authenticated
  using (true);

-- Index for fast grouping/ordering by listing
create index if not exists idx_inquiries_listing_id on public.inquiries(listing_id);
create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);
