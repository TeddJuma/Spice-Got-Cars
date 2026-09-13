-- Chat messages and conversations tables
-- Drop existing tables to ensure clean schema (in case they were created with wrong FK)
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  customer_name text,
  customer_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id text,  -- No FK: we use string IDs like "admin", "unknown", agent UUIDs, etc.
  sender_role text not null check (sender_role in ('admin', 'agent', 'customer')),
  content text not null,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations policies
-- Admins can do everything
create policy "Admins full access conversations"
  on public.conversations for all
  to authenticated
  using (true);

-- Agents can view conversations for their listings
create policy "Agents can view own conversations"
  on public.conversations for select
  to authenticated
  using (
    listing_id in (
      select id from public.listings where agent_id = auth.uid()
    )
  );

-- Customers can view their own conversations (by name/phone match)
create policy "Customers can view own conversations"
  on public.conversations for select
  to anon, authenticated
  using (true);

-- Customers can create conversations
create policy "Customers can create conversations"
  on public.conversations for insert
  to anon, authenticated
  with check (true);

-- Messages policies
-- Admins can do everything
create policy "Admins full access messages"
  on public.messages for all
  to authenticated
  using (true);

-- Agents can view/send messages for their listings' conversations
create policy "Agents can manage messages for own listings"
  on public.messages for all
  to authenticated
  using (
    conversation_id in (
      select c.id from public.conversations c
      join public.listings l on c.listing_id = l.id
      where l.agent_id = auth.uid()
    )
  );

-- Customers can view/send messages for their own conversations
create policy "Customers can manage own messages"
  on public.messages for all
  to anon, authenticated
  using (
    conversation_id in (
      select c.id from public.conversations c
      where c.customer_name = current_setting('request.jwt.claims', true)::json->>'customer_name'
        and c.customer_phone = current_setting('request.jwt.claims', true)::json->>'customer_phone'
    )
  )
  with check (
    conversation_id in (
      select c.id from public.conversations c
      where c.customer_name = current_setting('request.jwt.claims', true)::json->>'customer_name'
        and c.customer_phone = current_setting('request.jwt.claims', true)::json->>'customer_phone'
    )
  );

-- Allow anyone to insert messages (for customer chat initiation)
create policy "Anyone can insert messages"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- Indexes
create index if not exists idx_conversations_listing_id on public.conversations(listing_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);