-- Agent/seller accounts for the SGC platform
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null,
  id_number text not null,
  password_hash text not null,
  approved boolean not null default false,
  approved_until timestamptz,
  created_at timestamptz default now()
);

alter table public.agents enable row level security;

-- Public can sign up (insert their own agent record)
drop policy if exists "Public can register as agent" on public.agents;
create policy "Public can register as agent"
  on public.agents for insert
  to anon, authenticated
  with check (true);

-- Agents can read their own record
drop policy if exists "Agents can view own profile" on public.agents;
create policy "Agents can view own profile"
  on public.agents for select
  to authenticated
  using (true);

-- Agents can update their own profile
drop policy if exists "Agents can update own profile" on public.agents;
create policy "Agents can update own profile"
  on public.agents for update
  to authenticated
  using (true);

-- Admins can do everything
drop policy if exists "Admins full access agents" on public.agents;
create policy "Admins full access agents"
  on public.agents for all
  to authenticated
  using (true);

-- Payment records for agent activations
create table if not exists public.agent_payments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  mpesa_ref text not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table public.agent_payments enable row level security;

-- Agents can insert their own payment records
drop policy if exists "Agents can submit payments" on public.agent_payments;
create policy "Agents can submit payments"
  on public.agent_payments for insert
  to authenticated
  with check (true);

-- Agents can view their own payments
drop policy if exists "Agents can view own payments" on public.agent_payments;
create policy "Agents can view own payments"
  on public.agent_payments for select
  to authenticated
  using (true);

-- Admins can manage all payments
drop policy if exists "Admins full access payments" on public.agent_payments;
create policy "Admins full access payments"
  on public.agent_payments for all
  to authenticated
  using (true);

create index if not exists idx_agents_email on public.agents(email);
create index if not exists idx_agent_payments_agent_id on public.agent_payments(agent_id);
