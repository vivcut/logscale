import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

export type WorkspaceSubscription = {
  workspace_id: string;
  status: string | null;
  plan_tier: "free" | "pro" | "startup";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

/** User-facing plan names. The free/base tier is called the "Hobby plan". */
export const HOBBY_PLAN_NAME = "Hobby plan";
export const STARTUP_PLAN_NAME = "Startup plan";

/**
 * Single source of truth for what the Hobby (free) plan is limited to. The
 * Startup plan removes all of these limits. Server-side checks and UI banners
 * both read from here so the numbers never drift.
 */
export const PLAN_LIMITS = {
  maxBoards: 1,
  maxSurveys: 1,
  maxQuestionsPerSurvey: 3,
  maxStatusSites: 2,
  allowPostImages: false,
  allowChangelogImages: false,
  allowStatusPaths: false, // base origin URLs only on Hobby
  allowTeamMembers: false,
  allowContactCustomCopy: false, // can't change title / placeholder on Hobby
  showWatermark: true, // "Built with Pitstop" on public pages + widget
} as const;

/**
 * A workspace "has the Startup plan" when its subscription row is active and
 * sits on the startup tier. Cancelled / revoked rows fall back to Hobby.
 */
export function hasStartupPlan(sub: WorkspaceSubscription | null): boolean {
  if (!sub) return false;
  return sub.plan_tier === "startup" && sub.status === "active";
}

/** Returns the user-facing plan name for a subscription row. */
export function getPlanName(sub: WorkspaceSubscription | null): string {
  return hasStartupPlan(sub) ? STARTUP_PLAN_NAME : HOBBY_PLAN_NAME;
}

/**
 * Reads the subscription row for a given workspace. Returns null when the
 * workspace has never started a checkout (i.e. no row exists yet).
 *
 * Subscriptions are scoped to a single workspace and never transfer to other
 * workspaces — each workspace pays for its own plan.
 */
export async function getWorkspaceSubscription(
  workspaceId: string
): Promise<WorkspaceSubscription | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select(
      "workspace_id, status, plan_tier, stripe_customer_id, stripe_subscription_id, current_period_end"
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return (data as WorkspaceSubscription | null) ?? null;
}

/**
 * Convenience: does the CURRENT active workspace have the Startup plan?
 * Used by server actions to gate Hobby-plan limits. Returns false when there's
 * no workspace (the caller will handle that separately).
 */
export async function activeWorkspaceHasStartup(): Promise<boolean> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return false;
  const sub = await getWorkspaceSubscription(workspace.id);
  return hasStartupPlan(sub);
}
