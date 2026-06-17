-- Workspace editor invites.
-- Owners/admins invite collaborators by email. When a user whose email matches
-- a pending invite signs in, the app "claims" the invite and creates a
-- workspace_members row (role = 'admin'), then deletes the invite. The shared
-- workspace then appears in their switcher labelled "(shared)".

create table if not exists public.workspace_invites (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role text check (role in ('admin', 'member')) default 'admin' not null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (workspace_id, email)
);

alter table public.workspace_invites enable row level security;

-- Members of a workspace can see its pending invites.
drop policy if exists "Members read invites" on public.workspace_invites;
create policy "Members read invites"
 on public.workspace_invites for select
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = workspace_invites.workspace_id
    and m.profile_id = auth.uid()
  )
 );

-- Owners/admins can create invites for their workspace.
drop policy if exists "Admins create invites" on public.workspace_invites;
create policy "Admins create invites"
 on public.workspace_invites for insert
 with check (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = workspace_invites.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

-- Owners/admins can revoke invites.
drop policy if exists "Admins delete invites" on public.workspace_invites;
create policy "Admins delete invites"
 on public.workspace_invites for delete
 using (
  exists (
   select 1 from public.workspace_members m
   where m.workspace_id = workspace_invites.workspace_id
    and m.profile_id = auth.uid()
    and m.role in ('owner', 'admin')
  )
 );

create index if not exists workspace_invites_email_idx
 on public.workspace_invites (lower(email));
