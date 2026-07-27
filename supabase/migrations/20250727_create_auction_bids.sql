-- Auction bids table
create table public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  bid_amount integer not null check (bid_amount > 0),
  bidder_name text not null,
  bidder_phone text not null,
  national_id text,
  payment_reference text,
  terms_accepted boolean default false,
  created_at timestamptz default now()
);

alter table public.auction_bids enable row level security;

create policy "Public auction_bids are insertable by everyone"
  on public.auction_bids for insert
  to public
  with check (true);

create policy "Owners can read auction_bids"
  on public.auction_bids for select
  to authenticated
  using (true);

create policy "Owners can update auction_bids"
  on public.auction_bids for update
  to authenticated
  using (true);

create policy "Owners can delete auction_bids"
  on public.auction_bids for delete
  to authenticated
  using (true);
