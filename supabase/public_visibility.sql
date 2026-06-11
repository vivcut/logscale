-- =============================================================================
-- Public surface visibility toggles — schema additions
-- =============================================================================
-- Adds workspace-level booleans that control whether each public surface is
-- viewable by visitors. Toggling one OFF only hides the public page (returns
-- 404) and removes it from the widget — NO DATA IS DELETED. Everything defaults
-- to ON so existing workspaces keep their current behaviour.
--
-- (A `changelog_enabled` column already exists from flairs_and_changelog.sql;
--  this migration adds the remaining surfaces.)
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =============================================================================

alter table public.workspaces
  add column if not exists boards_enabled boolean not null default true;

alter table public.workspaces
  add column if not exists roadmap_enabled boolean not null default true;

alter table public.workspaces
  add column if not exists surveys_enabled boolean not null default true;

alter table public.workspaces
  add column if not exists status_enabled boolean not null default true;
