-- Changelog image storage bucket + public-read policy.
-- The /api/changelog/images route creates this bucket on first use via the
-- service role, but you can run this once up-front in the SQL editor too.

insert into storage.buckets (id, name, public)
values ('changelog-images', 'changelog-images', true)
on conflict (id) do nothing;

-- Anyone can read changelog images (they're shown on public changelog pages).
drop policy if exists "Public read changelog images" on storage.objects;
create policy "Public read changelog images"
  on storage.objects for select
  using (bucket_id = 'changelog-images');

-- Writes happen through the service-role client (API route), which bypasses
-- RLS, so no INSERT/UPDATE policy is required for the bucket.
