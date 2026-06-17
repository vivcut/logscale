-- Workspace logo storage bucket + public-read policy.
-- The uploadWorkspaceLogo server action creates this bucket on first use via
-- the service role, but you can run this once up-front in the SQL editor too.

insert into storage.buckets (id, name, public)
values ('workspace-logos', 'workspace-logos', true)
on conflict (id) do nothing;

-- Anyone can read logos (they're shown on public feedback/changelog pages).
drop policy if exists "Public read workspace logos" on storage.objects;
create policy "Public read workspace logos"
 on storage.objects for select
 using (bucket_id = 'workspace-logos');

-- Writes happen through the service-role client (server action), which bypasses
-- RLS, so no INSERT/UPDATE policy is required for the bucket.
