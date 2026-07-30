-- Allow public uploads to car-photos for unauthenticated sell submissions
drop policy if exists "Owners can upload car-photos" on storage.objects;

create policy "Public can upload car-photos"
  on storage.objects for insert
  to public
  with check (bucket_id = 'car-photos');
