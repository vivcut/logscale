-- Stripe subscriptions migration
-- Adds support for the "startup" plan tier and adjusts the subscriptions table
-- so checkout sessions / webhooks can create and update rows cleanly.
--
-- Subscriptions are scoped to a single workspace (workspace_id is unique). They
-- do NOT transfer to other workspaces — each workspace pays for its own plan.

-- 1. Allow the new "startup" plan tier (was only 'free' | 'pro').
alter table public.subscriptions
 drop constraint if exists subscriptions_plan_tier_check;

alter table public.subscriptions
 add constraint subscriptions_plan_tier_check
 check (plan_tier in ('free', 'pro', 'startup'));

-- 2. The Stripe customer id may not exist at row-creation time, and isn't
--  guaranteed unique across recreated customers — relax the NOT NULL so the
--  webhook can upsert without it being known upfront.
alter table public.subscriptions
 alter column stripe_customer_id drop not null;

-- 3. RLS: allow members of a workspace to read its subscription row so the
--  dashboard can show the current plan. Writes happen only via the service
--  role (Stripe webhook / checkout route), which bypasses RLS.
drop policy if exists "subscriptions_select_members" on public.subscriptions;

create policy "subscriptions_select_members"
 on public.subscriptions
 for select
 using (
  exists (
   select 1
   from public.workspace_members wm
   where wm.workspace_id = subscriptions.workspace_id
    and wm.profile_id = auth.uid()
  )
 );
