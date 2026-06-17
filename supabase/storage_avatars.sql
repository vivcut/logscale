-- User avatar storage bucket + public-read policy.
-- The uploadAvatar server action creates this bucket on first use via the
-- service role, but you can run this once up-front in the SQL editor too.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read avatars (they appear on dashboards and team-authored posts).
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
 on storage.objects for select
 using (bucket_id = 'avatars');

-- Writes happen through the service-role client (server action), which bypasses
-- RLS, so no INSERT/UPDATE policy is required for the bucket.
