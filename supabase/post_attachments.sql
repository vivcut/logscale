-- Post attachments: images & PDFs uploaded alongside a feedback post.
-- Images are shown inline on the post page; PDFs render as a clickable
-- document chip. Files live in a public-read storage bucket and their
-- metadata is tracked in public.post_attachments.

-- 1. Metadata table
create table if not exists public.post_attachments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  url text not null,
  path text not null, -- storage object path (for deletes)
  file_name text not null,
  content_type text not null,
  size integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists post_attachments_post_id_idx
  on public.post_attachments (post_id);

alter table public.post_attachments enable row level security;

-- Anyone can read attachment metadata (shown on public post pages).
drop policy if exists "Public read post attachments" on public.post_attachments;
create policy "Public read post attachments"
  on public.post_attachments for select
  using (true);

-- Writes happen through the service-role client (API route), which bypasses
-- RLS, so no INSERT/UPDATE/DELETE policy is required.

-- 2. Storage bucket (public read). The upload API creates this on first use
--  via the service role, but you can run this once up-front too.
insert into storage.buckets (id, name, public)
values ('post-attachments', 'post-attachments', true)
on conflict (id) do nothing;

drop policy if exists "Public read post attachments storage" on storage.objects;
create policy "Public read post attachments storage"
  on storage.objects for select
  using (bucket_id = 'post-attachments');
