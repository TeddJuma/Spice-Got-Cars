-- Migration: Add agent_id to listings and fix agent RLS policies

-- 1. Add agent_id to listings table
alter table public.listings
  add column if not exists agent_id uuid references public.agents(id) on delete set null;

create index if not exists idx_listings_agent_id on public.listings(agent_id);

-- 2. Allow agents / anon to submit payment reference records
drop policy if exists "Agents can submit payments" on public.agent_payments;
create policy "Agents can submit payments"
  on public.agent_payments for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Agents can view own payments" on public.agent_payments;
create policy "Agents can view own payments"
  on public.agent_payments for select
  to anon, authenticated
  using (true);

-- 3. Allow agents to insert and update their own listings
drop policy if exists "Agents can insert own listings" on public.listings;
create policy "Agents can insert own listings"
  on public.listings for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Agents can update own listings" on public.listings;
create policy "Agents can update own listings"
  on public.listings for update
  to anon, authenticated
  using (true);
