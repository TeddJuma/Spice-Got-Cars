-- Add auction support to listings
alter table public.listings
  add column if not exists is_auction boolean default false,
  add column if not exists auction_ends_at timestamptz,
  add column if not exists starting_bid_kes integer,
  add column if not exists current_bid_kes integer,
  add column if not exists bid_count integer default 0,
  add column if not exists highest_bidder text;

create index if not exists listings_is_auction_idx on public.listings (is_auction);
create index if not exists listings_auction_ends_at_idx on public.listings (auction_ends_at);
