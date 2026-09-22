-- Add payment_verified column to auction_bids table
alter table public.auction_bids
  add column if not exists payment_verified boolean default false;

-- Add index for payment_verified filtering
create index if not exists idx_auction_bids_payment_verified on public.auction_bids(payment_verified);

-- Function to check if bidder has verified payment before allowing bid
create or replace function public.check_bidder_payment_verified()
returns trigger as $$
declare
  verified boolean;
begin
  -- Check if the payment_reference exists in agent_payments and is approved
  select exists (
    select 1 from public.agent_payments ap
    where ap.mpesa_ref = NEW.payment_reference
      and ap.status = 'approved'
  ) into verified;
  
  if not verified then
    raise exception 'Payment reference not verified. Please ensure your M-PESA payment has been approved by an admin before bidding.';
  end if;
  
  NEW.payment_verified := true;
  return NEW;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists check_bidder_payment_verified_trigger on public.auction_bids;

-- Create trigger to verify payment before insert
create trigger check_bidder_payment_verified_trigger
  before insert on public.auction_bids
  for each row execute procedure public.check_bidder_payment_verified();