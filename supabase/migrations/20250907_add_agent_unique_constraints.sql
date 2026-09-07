-- Add unique constraints for agent login identifiers
-- Run this AFTER ensuring no duplicate phone numbers or ID numbers exist in the agents table

-- Check for duplicate phone numbers first
-- SELECT phone, COUNT(*) FROM public.agents GROUP BY phone HAVING COUNT(*) > 1;

-- Check for duplicate ID numbers first
-- SELECT id_number, COUNT(*) FROM public.agents GROUP BY id_number HAVING COUNT(*) > 1;

-- If no duplicates found, run the statements below:
create unique index if not exists idx_agents_phone on public.agents(phone);
create unique index if not exists idx_agents_id_number on public.agents(id_number);
