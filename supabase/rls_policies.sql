-- =============================================================================
-- Row Level Security Policies
-- =============================================================================
-- The base schema enables RLS on every table but defines no policies, which
-- means Postgres denies ALL access by default (hence "permission denied for
-- table workspaces"). Run this file in the Supabase SQL Editor AFTER schema.sql
-- and auth_trigger.sql to grant the correct, tenant-scoped access.
--
-- NOTE: server-side code that uses the SERVICE ROLE key (lib/supabase/admin.ts)
-- bypasses RLS entirely. These policies govern the anon/authenticated clients
-- used by the dashboard (server actions run as the logged-in user).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. TABLE-LEVEL GRANTS (fixes "permission denied for table workspaces")
-- -----------------------------------------------------------------------------
-- RLS only runs AFTER the role passes the SQL GRANT check. If the
-- authenticated/anon roles have no privileges on the public tables, Postgres
-- rejects the query with "permission denied for table ..." before any policy
-- is evaluated. Supabase normally wires these up automatically, but if the
-- grants are missing (or were created under a different role) you must add
-- them explicitly. RLS policies below still constrain WHICH rows are visible.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- service_role is used by the server-side admin client (lib/supabase/admin.ts)
-- which powers ALL the public pages (/public/*, /widget/*). It bypasses RLS
-- but STILL needs table grants — without them every public page 404s because
-- the workspace lookup returns "permission denied".
grant all privileges
 on all tables in schema public
 to service_role;
grant all privileges
 on all sequences in schema public
 to service_role;

grant select, insert, update, delete
 on all tables in schema public
 to authenticated;

grant select
 on all tables in schema public
 to anon;

grant usage, select
 on all sequences in schema public
 to anon, authenticated;

-- Make sure tables/sequences created in the future inherit the same grants.
alter default privileges in schema public
 grant all on tables to service_role;
alter default privileges in schema public
 grant all on sequences to service_role;
alter default privileges in schema public
 grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
 grant select on tables to anon;
alter default privileges in schema public
 grant usage, select on sequences to anon, authenticated;


-- -----------------------------------------------------------------------------
-- Helper: is the current user a member of a given workspace?

-- SECURITY DEFINER + a dedicated function avoids the infinite-recursion trap
-- that happens when workspace_members policies reference workspace_members.
-- -----------------------------------------------------------------------------
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
 select exists (
  select 1
  from public.workspace_members
  where workspace_id = ws_id
   and profile_id = auth.uid()
 );
$$;

create or replace function public.is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
 select exists (
  select 1
  from public.workspace_members
  where workspace_id = ws_id
   and profile_id = auth.uid()
   and role in ('owner', 'admin')
 );
$$;

-- =============================================================================
-- PROFILES
-- =============================================================================
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
 on public.profiles for select
 using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
 on public.profiles for update
 using (auth.uid() = id)
 with check (auth.uid() = id);

-- Inserts are handled by the auth trigger (security definer); allow self-insert
-- as a fallback for clients.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
 on public.profiles for insert
 with check (auth.uid() = id);

-- =============================================================================
-- WORKSPACES
-- =============================================================================
-- A user can read workspaces they own or are a member of.
drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
 on public.workspaces for select
 using (
  owner_id = auth.uid()
  or public.is_workspace_member(id)
 );

-- Any authenticated user may create a workspace, as long as they set
-- themselves as the owner.
drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
 on public.workspaces for insert
 with check (owner_id = auth.uid());

-- Only the owner can update / delete the workspace.
drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
 on public.workspaces for update
 using (owner_id = auth.uid())
 with check (owner_id = auth.uid());

drop policy if exists "workspaces_delete_owner" on public.workspaces;
create policy "workspaces_delete_owner"
 on public.workspaces for delete
 using (owner_id = auth.uid());

-- =============================================================================
-- WORKSPACE MEMBERS
-- =============================================================================
-- Members can see the membership rows of workspaces they belong to.
drop policy if exists "members_select" on public.workspace_members;
create policy "members_select"
 on public.workspace_members for select
 using (public.is_workspace_member(workspace_id));

-- A user may insert their OWN membership row (used when creating a workspace,
-- linking themselves as owner), OR an existing admin may add members.
drop policy if exists "members_insert" on public.workspace_members;
create policy "members_insert"
 on public.workspace_members for insert
 with check (
  profile_id = auth.uid()
  or public.is_workspace_admin(workspace_id)
 );

-- Admins/owners may update or remove members.
drop policy if exists "members_update" on public.workspace_members;
create policy "members_update"
 on public.workspace_members for update
 using (public.is_workspace_admin(workspace_id))
 with check (public.is_workspace_admin(workspace_id));

drop policy if exists "members_delete" on public.workspace_members;
create policy "members_delete"
 on public.workspace_members for delete
 using (
  profile_id = auth.uid()
  or public.is_workspace_admin(workspace_id)
 );

-- =============================================================================
-- BOARDS
-- =============================================================================
drop policy if exists "boards_select_member" on public.boards;
create policy "boards_select_member"
 on public.boards for select
 using (public.is_workspace_member(workspace_id));

drop policy if exists "boards_insert_admin" on public.boards;
create policy "boards_insert_admin"
 on public.boards for insert
 with check (public.is_workspace_admin(workspace_id));

drop policy if exists "boards_update_admin" on public.boards;
create policy "boards_update_admin"
 on public.boards for update
 using (public.is_workspace_admin(workspace_id))
 with check (public.is_workspace_admin(workspace_id));

drop policy if exists "boards_delete_admin" on public.boards;
create policy "boards_delete_admin"
 on public.boards for delete
 using (public.is_workspace_admin(workspace_id));

-- =============================================================================
-- POSTS
-- =============================================================================
-- Members of the owning workspace can read/manage posts via the dashboard.
-- (Public, anonymous reads/writes go through the service-role admin client.)
drop policy if exists "posts_select_member" on public.posts;
create policy "posts_select_member"
 on public.posts for select
 using (
  exists (
   select 1 from public.boards b
   where b.id = posts.board_id
    and public.is_workspace_member(b.workspace_id)
  )
 );

drop policy if exists "posts_update_admin" on public.posts;
create policy "posts_update_admin"
 on public.posts for update
 using (
  exists (
   select 1 from public.boards b
   where b.id = posts.board_id
    and public.is_workspace_admin(b.workspace_id)
  )
 );

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
 on public.posts for delete
 using (
  exists (
   select 1 from public.boards b
   where b.id = posts.board_id
    and public.is_workspace_admin(b.workspace_id)
  )
 );

-- =============================================================================
-- COMMENTS
-- =============================================================================
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

drop policy if exists "comments_insert_member" on public.comments;
create policy "comments_insert_member"
 on public.comments for insert
 with check (user_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
 on public.comments for delete
 using (user_id = auth.uid());

-- =============================================================================
-- CHANGELOGS
-- =============================================================================
drop policy if exists "changelogs_select_member" on public.changelogs;
create policy "changelogs_select_member"
 on public.changelogs for select
 using (public.is_workspace_member(workspace_id));

drop policy if exists "changelogs_insert_admin" on public.changelogs;
create policy "changelogs_insert_admin"
 on public.changelogs for insert
 with check (public.is_workspace_admin(workspace_id));

drop policy if exists "changelogs_update_admin" on public.changelogs;
create policy "changelogs_update_admin"
 on public.changelogs for update
 using (public.is_workspace_admin(workspace_id))
 with check (public.is_workspace_admin(workspace_id));

drop policy if exists "changelogs_delete_admin" on public.changelogs;
create policy "changelogs_delete_admin"
 on public.changelogs for delete
 using (public.is_workspace_admin(workspace_id));

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================
drop policy if exists "subscriptions_select_member" on public.subscriptions;
create policy "subscriptions_select_member"
 on public.subscriptions for select
 using (public.is_workspace_member(workspace_id));

-- Billing writes are performed by the service role (webhooks), so no
-- insert/update policies are granted to regular clients.
