-- Add notes column to inquiries table
alter table public.inquiries
  add column if not exists notes text;

-- Index for notes search if needed
create index if not exists idx_inquiries_notes on public.inquiries using gin (to_tsvector('english', notes));