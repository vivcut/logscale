-- =============================================================================
-- Admin Board feature — schema additions
-- =============================================================================
-- Adds the columns + tables that power the owner-side feedback board:
--   * post categories (for the "Top Requested Category" metric)
--   * private internal admin notes
--   * a pinned official response (public)
--   * post merging / de-duplication
--   * post followers (broadcast counter for status-change notifications)
--
-- Run in the Supabase SQL Editor AFTER schema.sql. Safe to re-run.
-- =============================================================================

-- 1. New columns on posts -----------------------------------------------------
alter table public.posts
  add column if not exists category text,
  add column if not exists admin_notes text,           -- private, owner-only
  add column if not exists pinned_response text,        -- public official reply
  add column if not exists merged_into_id uuid
    references public.posts(id) on delete set null;

-- Helpful index for fast triage (board + status).
create index if not exists posts_board_status_idx
  on public.posts (board_id, status);

-- 2. Post followers -----------------------------------------------------------
-- Tracks who is subscribed to a post so we know the broadcast reach when a
-- status changes (e.g. -> completed). Supports both authenticated users and
-- anonymous fingerprinted devices, mirroring the upvotes design.
create table if not exists public.post_followers (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.posts(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade,
    fingerprint_hash text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index if not exists followers_user_post_idx
  on public.post_followers (post_id, user_id) where user_id is not null;
create unique index if not exists followers_fingerprint_post_idx
  on public.post_followers (post_id, fingerprint_hash) where user_id is null;

alter table public.post_followers enable row level security;

-- 3. Merge helper -------------------------------------------------------------
-- Cleanly merges the SOURCE post into the TARGET post:
--   * moves upvotes (skipping ones that would duplicate a target vote)
--   * moves comments & followers
--   * recomputes the target's upvotes_count from the upvotes table
--   * marks the source as merged (status 'closed', merged_into_id set)
-- Runs as SECURITY DEFINER so the single statement is atomic and bypasses the
-- per-row triggers' race conditions.
create or replace function public.merge_post(source_id uuid, target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if source_id = target_id then
    raise exception 'Cannot merge a post into itself';
  end if;

  -- Move upvotes that do not collide with an existing target vote.
  update public.upvotes u
    set post_id = target_id
  where u.post_id = source_id
    and not exists (
      select 1 from public.upvotes t
      where t.post_id = target_id
        and (
          (t.user_id is not null and t.user_id = u.user_id)
          or (t.user_id is null and t.fingerprint_hash = u.fingerprint_hash)
        )
    );

  -- Drop any remaining (duplicate) source upvotes.
  delete from public.upvotes where post_id = source_id;

  -- Move comments + followers across.
  update public.comments set post_id = target_id where post_id = source_id;
  update public.post_followers f
    set post_id = target_id
  where f.post_id = source_id
    and not exists (
      select 1 from public.post_followers t
      where t.post_id = target_id
        and (
          (t.user_id is not null and t.user_id = f.user_id)
          or (t.user_id is null and t.fingerprint_hash = f.fingerprint_hash)
        )
    );
  delete from public.post_followers where post_id = source_id;

  -- Recompute the authoritative upvote count on the target.
  update public.posts
    set upvotes_count = (
      select count(*) from public.upvotes where post_id = target_id
    )
  where id = target_id;

  -- Mark the source as merged + closed.
  update public.posts
    set status = 'closed',
        merged_into_id = target_id,
        upvotes_count = 0
  where id = source_id;
end;
$$;

-- 4. RLS policies for post_followers -----------------------------------------
-- Anyone may follow/unfollow their own subscription; admin reads go through
-- the service role (used by the dashboard drawer's follower count).
drop policy if exists "followers_insert_self" on public.post_followers;
create policy "followers_insert_self"
  on public.post_followers for insert
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "followers_delete_self" on public.post_followers;
create policy "followers_delete_self"
  on public.post_followers for delete
  using (user_id = auth.uid());

drop policy if exists "followers_select_self" on public.post_followers;
create policy "followers_select_self"
  on public.post_followers for select
  using (user_id = auth.uid());

-- 5. Grants -------------------------------------------------------------------
grant all on public.post_followers to service_role;
grant select, insert, delete on public.post_followers to authenticated;
grant select, insert, delete on public.post_followers to anon;
grant execute on function public.merge_post(uuid, uuid) to service_role, authenticated;

