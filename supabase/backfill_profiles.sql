-- =============================================================================
-- Backfill profiles for pre-existing auth users
-- =============================================================================
-- If you signed up BEFORE installing auth_trigger.sql, your auth.users row has
-- no matching public.profiles row. Any insert into workspaces (owner_id) or
-- workspace_members (profile_id) then fails with:
--   insert or update on table "workspaces" violates foreign key constraint
--   "workspaces_owner_id_fkey"
--
-- Run this once in the Supabase SQL Editor to create the missing profile rows
-- for every existing user. It is safe to re-run (ON CONFLICT DO NOTHING).
-- =============================================================================
insert into public.profiles (id, name, email, avatar_url)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'name',
    'New User'
  ),
  u.email,
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
