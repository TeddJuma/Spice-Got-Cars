-- Split bidder name into first/last and auto-update auction listing summary
alter table public.auction_bids
  add column if not exists bidder_first_name text,
  add column if not exists bidder_last_name text;

create or replace function public.update_auction_listing()
returns trigger as $$
begin
  update public.listings
  set
    current_bid_kes = NEW.bid_amount,
    bid_count = (select count(*) from public.auction_bids where listing_id = NEW.listing_id),
    highest_bidder = NEW.bidder_first_name || ' ' || left(NEW.bidder_last_name, 1) || '.'
  where id = NEW.listing_id;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists update_auction_listing_trigger on public.auction_bids;

create trigger update_auction_listing_trigger
  after insert on public.auction_bids
  for each row execute procedure public.update_auction_listing();
