-- =============================================================================
-- Incident updates — human-written status posts for monitored services
-- =============================================================================
-- The automatic checker logs raw UP/DOWN transitions in site_status_events.
-- This table lets owners/admins layer human context on top of those machine
-- events: a titled update with a stage tag (Investigating → Identified →
-- Monitoring → Resolved) and a markdown-ish description.
--
-- The public + dashboard "incident log" merges these manual updates with the
-- automatic status changes into one chronological timeline.
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =============================================================================

create table if not exists public.site_incidents (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.monitored_sites (id) on delete cascade not null,
  title text not null,
  body text,
  -- Lifecycle stage of the incident update.
  tag text check (tag in ('investigating', 'identified', 'monitoring', 'resolved'))
    default 'investigating' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists site_incidents_site_idx
  on public.site_incidents (site_id, created_at desc);

alter table public.site_incidents enable row level security;

-- Members can READ incident updates for their workspace's sites.
drop policy if exists "site_incidents_select_member" on public.site_incidents;
create policy "site_incidents_select_member"
  on public.site_incidents for select
  using (
    exists (
      select 1
      from public.monitored_sites s
      join public.workspace_members m on m.workspace_id = s.workspace_id
      where s.id = site_incidents.site_id
        and m.profile_id = auth.uid()
    )
  );

-- Owners/admins can WRITE/EDIT/DELETE incident updates.
drop policy if exists "site_incidents_write_admin" on public.site_incidents;
create policy "site_incidents_write_admin"
  on public.site_incidents for all
  using (
    exists (
      select 1
      from public.monitored_sites s
      join public.workspace_members m on m.workspace_id = s.workspace_id
      where s.id = site_incidents.site_id
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.monitored_sites s
      join public.workspace_members m on m.workspace_id = s.workspace_id
      where s.id = site_incidents.site_id
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- NOTE: public status pages read incident updates via the service-role admin
-- client, so they render regardless of these policies.
