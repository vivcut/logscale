-- =============================================================================
-- Comments + anonymous author identity — schema additions
-- =============================================================================
-- Adds:
--   * optional contact identity on posts (anonymous submitters can leave a
--     name + email so the owner can reach back out)
--   * a full public comment thread on posts that supports anonymous authors
--     (name + email required) AND verified official replies from the
--     workspace owner/admins, including threaded replies to other comments.
--
-- Run in the Supabase SQL Editor AFTER schema.sql + admin_board.sql.
-- Safe to re-run.
-- =============================================================================

-- 1. Optional contact identity on posts --------------------------------------
alter table public.posts
  add column if not exists author_name text,
  add column if not exists author_email text;

-- 2. Comments: support anonymous authors + official replies + threading -------
-- The base schema created comments with a NOT NULL user_id and no author
-- identity. Relax it so public visitors can comment with a name + email, and
-- add the columns the official-reply / threading UX needs.
alter table public.comments
  alter column user_id drop not null;

alter table public.comments
  add column if not exists author_name text,
  add column if not exists author_email text,
  add column if not exists fingerprint_hash text,
  add column if not exists is_official boolean default false not null,
  add column if not exists parent_id uuid
    references public.comments(id) on delete cascade;

create index if not exists comments_post_idx on public.comments (post_id);
create index if not exists comments_parent_idx on public.comments (parent_id);

-- 3. Grants -------------------------------------------------------------------
-- Public comment ingestion goes through the service-role admin client, but
-- keep sane grants for the authenticated dashboard reads.
grant select, insert, update, delete on public.comments to authenticated;
grant select on public.comments to anon;

-- 4. RLS: allow members to read all comments on their workspace's posts -------
drop policy if exists "comments_select_member" on public.comments;
create policy "comments_select_member"
  on public.comments for select
  using (
    exists (
      select 1
      from public.posts p
      join public.boards b on b.id = p.board_id
      where p.id = comments.post_id
        and public.is_workspace_member(b.workspace_id)
    )
  );
