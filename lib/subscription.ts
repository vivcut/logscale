import { createAdminClient } from "@/lib/supabase/admin";
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
 maxUsers: 25, // unique external users who posted or commented
 allowPostImages: false,
 allowChangelogImages: false,
 allowStatusPaths: false, // base origin URLs only on Hobby
 allowTeamMembers: false,
 allowContactCustomCopy: false, // can't change title / placeholder on Hobby
 showWatermark: true, // "Built with Pittstop" on public pages + widget
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
 // Use the admin client to bypass RLS so that public pages (where the visitor
 // may be anonymous) can still read the workspace's plan tier. Subscription
 // data is non-sensitive (plan name + status) and this avoids the RLS policy
 // that limits reads to workspace members only.
 const admin = createAdminClient();

 const { data } = await admin
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

/**
 * Count unique external (non-admin) users who have posted or commented
 * in any board belonging to this workspace. Deduplicates by user_id.
 */
export async function countExternalUsers(workspaceId: string): Promise<number> {
 const admin = createAdminClient();

 // Get board IDs for this workspace
 const { data: boards } = await admin
  .from("boards")
  .select("id")
  .eq("workspace_id", workspaceId);
 const boardIds = (boards ?? []).map((b) => b.id);
 if (boardIds.length === 0) return 0;

 // Get admin user IDs (workspace members with owner/admin roles)
 const { data: members } = await admin
  .from("workspace_members")
  .select("profile_id")
  .eq("workspace_id", workspaceId);
 const adminIds = new Set((members ?? []).map((m) => m.profile_id));

 // Get unique user_ids from posts in these boards
 const { data: posts } = await admin
  .from("posts")
  .select("user_id")
  .in("board_id", boardIds)
  .not("user_id", "is", null);

 // Get post IDs to find comments
 const { data: allPosts } = await admin
  .from("posts")
  .select("id")
  .in("board_id", boardIds);
 const postIds = (allPosts ?? []).map((p) => p.id);

 // Get unique user_ids from comments on those posts
 let commentUserIds: string[] = [];
 if (postIds.length > 0) {
  const { data: comments } = await admin
   .from("comments")
   .select("user_id")
   .in("post_id", postIds)
   .not("user_id", "is", null);
  commentUserIds = (comments ?? []).map((c) => c.user_id);
 }

 // Combine and deduplicate, excluding admins
 const allUserIds = new Set<string>();
 for (const p of posts ?? []) {
  if (p.user_id && !adminIds.has(p.user_id)) allUserIds.add(p.user_id);
 }
 for (const uid of commentUserIds) {
  if (uid && !adminIds.has(uid)) allUserIds.add(uid);
 }

 return allUserIds.size;
}
