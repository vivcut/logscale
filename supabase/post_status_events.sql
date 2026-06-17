-- =============================================================================
-- Post status timeline + pinned comments — schema additions
-- =============================================================================
-- Adds:
--  * post_status_events: an append-only log recording WHEN a post entered each
--   status (under-review / planned / in-progress / completed / closed) so the
--   public detail page can render a dated lifecycle timeline.
--  * comments.is_pinned: lets the workspace owner pin one answer to the top of
--   a post's discussion thread (shown before everything else).
--
-- Run in the Supabase SQL Editor AFTER schema.sql + comments_and_authors.sql.
-- Safe to re-run.
-- =============================================================================

-- 1. Status timeline ----------------------------------------------------------
create table if not exists public.post_status_events (
 id uuid default gen_random_uuid() primary key,
 post_id uuid references public.posts(id) on delete cascade not null,
 status text not null,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists post_status_events_post_idx
 on public.post_status_events (post_id, created_at);

alter table public.post_status_events enable row level security;

-- Status events are non-sensitive (status label + date) and reads on the public
-- board go through the service-role client anyway. Allow public read.
drop policy if exists "post_status_events_public_read" on public.post_status_events;
create policy "post_status_events_public_read"
 on public.post_status_events for select
 using (true);

grant select on public.post_status_events to anon, authenticated;

-- Seed an initial "under-review" (or current status) event for any existing
-- posts that don't have one yet, backdated to their creation time.
insert into public.post_status_events (post_id, status, created_at)
select p.id, p.status, p.created_at
from public.posts p
where not exists (
 select 1 from public.post_status_events e where e.post_id = p.id
);

-- 2. Pinned comments ----------------------------------------------------------
alter table public.comments
 add column if not exists is_pinned boolean default false not null;
