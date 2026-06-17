-- =============================================================================
-- Uptime monitoring — monitored_sites + site_status_events (change log) + RLS
-- =============================================================================
-- Workspace-scoped uptime monitoring. A batched Supabase Edge Function
-- (supabase/functions/check-uptime/index.ts) probes every site every 2 minutes
-- and:
--  * always updates monitored_sites.status + last_checked_at
--  * inserts a row into site_status_events ONLY when the status CHANGES
--
-- That "log only changes" design means we can render a full, continuous history
-- timeline (UP since X, then DOWN at Y, …) while storing a tiny number of rows.
--
-- New sites start as 'PENDING' so the UI shows "Checked soon" until the first
-- probe runs (instead of falsely claiming "Up").
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- 1. monitored_sites -----------------------------------------------------------
create table if not exists public.monitored_sites (
 id uuid default gen_random_uuid() primary key,
 workspace_id uuid references public.workspaces (id) on delete cascade not null,
 user_id uuid references auth.users (id) on delete set null,
 title text,
 url text not null,
 status text default 'PENDING' not null,
 last_checked_at timestamp with time zone,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Backfill-friendly: add columns if the table already existed in an older form.
alter table public.monitored_sites
 add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;
alter table public.monitored_sites
 add column if not exists title text;
alter table public.monitored_sites
 alter column status set default 'PENDING';
alter table public.monitored_sites
 alter column user_id drop not null;

create index if not exists monitored_sites_workspace_idx
 on public.monitored_sites (workspace_id, created_at desc);

-- 2. site_status_events (change log) ------------------------------------------
create table if not exists public.site_status_events (
 id uuid default gen_random_uuid() primary key,
 site_id uuid references public.monitored_sites (id) on delete cascade not null,
 status text not null,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists site_status_events_site_idx
 on public.site_status_events (site_id, created_at desc);

-- 3. Row Level Security --------------------------------------------------------
alter table public.monitored_sites enable row level security;
alter table public.site_status_events enable row level security;

-- Any workspace member can VIEW that workspace's monitored sites.
drop policy if exists "monitored_sites_select_member" on public.monitored_sites;
create policy "monitored_sites_select_member"
 on public.monitored_sites for select
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = monitored_sites.workspace_id
    and m.profile_id = auth.uid()
  )
 );

-- Owners/admins can ADD sites for their workspace.
drop policy if exists "monitored_sites_insert_admin" on public.monitored_sites;
create policy "monitored_sites_insert_admin"
 on public.monitored_sites for insert
 with check (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = monitored_sites.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- Owners/admins can EDIT (e.g. set a title) sites in their workspace.
drop policy if exists "monitored_sites_update_admin" on public.monitored_sites;
create policy "monitored_sites_update_admin"
 on public.monitored_sites for update
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = monitored_sites.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- Owners/admins can DELETE sites in their workspace.
drop policy if exists "monitored_sites_delete_admin" on public.monitored_sites;
create policy "monitored_sites_delete_admin"
 on public.monitored_sites for delete
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = monitored_sites.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- Members can read the status history of their workspace's sites.
drop policy if exists "site_status_events_select_member" on public.site_status_events;
create policy "site_status_events_select_member"
 on public.site_status_events for select
 using (
  exists (
   select 1
   from public.monitored_sites s
   join public.workspace_members m on m.workspace_id = s.workspace_id
   where s.id = site_status_events.site_id
    and m.profile_id = auth.uid()
  )
 );

-- NOTE: the background checker writes status, last_checked_at, and event rows
-- using the SERVICE ROLE key, which bypasses RLS — so no insert policy is
-- needed for the cron job. Public pages also read via the service-role admin
-- client, so they work regardless of these policies.
