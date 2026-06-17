-- =============================================================================
-- Contact Page
-- =============================================================================
-- A lightweight "Contact us" surface for each workspace. Owners/admins control
-- the heading text, the textarea placeholder, and whether the email + SMS
-- (phone) fields are optional or mandatory. Visitors submit a message from the
-- public page or the embeddable widget; submissions land in the dashboard for
-- the team to review.
--
-- This migration adds:
--  * workspace-level configuration columns (title / placeholder / required
--   flags + an enabled toggle, consistent with the other public surfaces)
--  * the contact_submissions table
--  * RLS so workspace members can read submissions (public inserts go through
--   the service-role admin client, matching the survey submission flow)
--
-- Everything defaults to ON so existing workspaces keep working. Run in the
-- Supabase SQL Editor. Safe to re-run.
-- =============================================================================

-- 1. Workspace configuration columns ------------------------------------------
alter table public.workspaces
 add column if not exists contact_enabled boolean not null default true;

alter table public.workspaces
 add column if not exists contact_title text not null default 'Contact us';

alter table public.workspaces
 add column if not exists contact_placeholder text not null
  default 'How can we help?';

-- Whether the email / SMS fields must be filled in by the visitor.
alter table public.workspaces
 add column if not exists contact_email_required boolean not null default true;

alter table public.workspaces
 add column if not exists contact_sms_required boolean not null default false;

-- 2. contact_submissions -------------------------------------------------------
create table if not exists public.contact_submissions (
 id uuid default gen_random_uuid() primary key,
 workspace_id uuid references public.workspaces (id) on delete cascade not null,
 message text not null,
 email text,
 sms text,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists contact_submissions_workspace_idx
 on public.contact_submissions (workspace_id, created_at desc);

-- 3. Row Level Security --------------------------------------------------------
alter table public.contact_submissions enable row level security;

-- Members of the owning workspace can read submissions (for the team inbox).
drop policy if exists "contact_submissions_select_member" on public.contact_submissions;
create policy "contact_submissions_select_member"
 on public.contact_submissions for select
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = contact_submissions.workspace_id
    and m.profile_id = auth.uid()
  )
 );

-- Owners/admins can delete submissions (e.g. clearing spam).
drop policy if exists "contact_submissions_delete_admin" on public.contact_submissions;
create policy "contact_submissions_delete_admin"
 on public.contact_submissions for delete
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = contact_submissions.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- NOTE: anonymous public submission (INSERT) is performed with the service-role
-- admin client, so there is intentionally no public INSERT policy here.
