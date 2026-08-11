-- Auction windows for listings
create table if not exists public.auction_windows (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.auction_windows enable row level security;

create policy "Public auction_windows are viewable by everyone"
  on public.auction_windows for select
  to public
  using (true);

create policy "Owners can insert auction_windows"
  on public.auction_windows for insert
  to authenticated
  with check (true);

create policy "Owners can update auction_windows"
  on public.auction_windows for update
  to authenticated
  using (true);

create policy "Owners can delete auction_windows"
  on public.auction_windows for delete
  to authenticated
  using (true);
