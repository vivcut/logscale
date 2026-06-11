-- =============================================================================
-- Flairs + Changelog toggle — schema additions
-- =============================================================================
-- Adds:
--   * board-level flairs (required tags) seeded with "feedback" + "bug" that
--     owners can extend per board
--   * a required `flair` tag on every post (public submissions + internal posts)
--   * a workspace-level `changelog_enabled` toggle that hides the public
--     changelog and its links when off
--
-- Run in the Supabase SQL Editor AFTER schema.sql + admin_board.sql. Safe to
-- re-run.
-- =============================================================================

-- 1. Board flairs -------------------------------------------------------------
-- The owner-defined set of selectable tags for a board. Seeded with the two
-- base flairs every board starts with.
alter table public.boards
  add column if not exists flairs text[]
    not null default array['feedback', 'bug']::text[];

-- 2. Post flair ---------------------------------------------------------------
-- Every newly created post must carry a flair (enforced in the app layer).
-- Nullable so historical rows created before this migration remain valid.
alter table public.posts
  add column if not exists flair text;

-- 3. Workspace changelog toggle ----------------------------------------------
alter table public.workspaces
  add column if not exists changelog_enabled boolean not null default true;
