-- Allow owners to delete notifications
create policy "Owners can delete notifications"
  on public.notifications for delete
  to authenticated
  using (true);
