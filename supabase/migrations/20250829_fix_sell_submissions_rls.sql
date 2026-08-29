-- Ensure sell_submissions exists and anonymous visitors can insert (used by the public /sell page).
-- Idempotent so it is safe to re-run.

create table if not exists public.sell_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  make text not null,
  model text not null,
  year integer not null,
  mileage_km integer not null,
  condition text not null check (condition in ('New', 'Foreign Used', 'Locally Used')),
  asking_price integer not null,
  location text not null,
  notes text,
  photos jsonb default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sell_submissions add column if not exists engine_capacity integer;

alter table public.sell_submissions enable row level security;

drop policy if exists "Public sell_submissions are insertable by everyone" on public.sell_submissions;
create policy "Public sell_submissions are insertable by everyone"
  on public.sell_submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Owners can read sell_submissions" on public.sell_submissions;
create policy "Owners can read sell_submissions"
  on public.sell_submissions for select
  to authenticated
  using (true);

drop policy if exists "Owners can update sell_submissions" on public.sell_submissions;
create policy "Owners can update sell_submissions"
  on public.sell_submissions for update
  to authenticated
  using (true);

drop policy if exists "Owners can delete sell_submissions" on public.sell_submissions;
create policy "Owners can delete sell_submissions"
  on public.sell_submissions for delete
  to authenticated
  using (true);

create or replace function public.handle_sell_submission_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sell_submissions_set_updated_at on public.sell_submissions;
create trigger sell_submissions_set_updated_at
  before update on public.sell_submissions
  for each row execute procedure public.handle_sell_submission_updated_at();
