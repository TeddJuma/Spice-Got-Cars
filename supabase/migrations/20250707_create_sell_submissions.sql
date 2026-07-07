-- Sell submissions from the /sell page
create table public.sell_submissions (
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

alter table public.sell_submissions enable row level security;

create policy "Public sell_submissions are insertable by everyone"
  on public.sell_submissions for insert
  to public
  with check (true);

create policy "Owners can read sell_submissions"
  on public.sell_submissions for select
  to authenticated
  using (true);

create policy "Owners can update sell_submissions"
  on public.sell_submissions for update
  to authenticated
  using (true);

create or replace function public.handle_sell_submission_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sell_submissions_set_updated_at
  before update on public.sell_submissions
  for each row execute procedure public.handle_sell_submission_updated_at();

-- Notifications for owners
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Owners can read notifications"
  on public.notifications for select
  to authenticated
  using (true);

create policy "Owners can update notifications"
  on public.notifications for update
  to authenticated
  using (true);

create policy "System can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (true);
