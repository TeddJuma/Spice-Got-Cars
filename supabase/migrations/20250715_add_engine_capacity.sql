-- Add engine capacity to sell submissions
alter table public.sell_submissions
  add column engine_capacity integer;
