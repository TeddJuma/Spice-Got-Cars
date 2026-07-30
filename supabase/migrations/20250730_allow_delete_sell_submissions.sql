-- Allow owners to delete sell_submissions
create policy "Owners can delete sell_submissions"
  on public.sell_submissions for delete
  to authenticated
  using (true);
