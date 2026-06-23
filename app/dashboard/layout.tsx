import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { claimPendingInvites } from "@/lib/invites";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceSubscription, hasStartupPlan, countExternalUsers, PLAN_LIMITS } from "@/lib/subscription";
import { DashboardSidebar } from "./sidebar";
import { PageTransition } from "./page-transition";
import { OverLimitDialog } from "@/components/over-limit-dialog";

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  redirect("/login");
 }

 await claimPendingInvites(user.id, user.email ?? "");

 const { data: memberships } = await supabase
  .from("workspace_members")
  .select("role, workspaces ( id, name, slug, logo_url )")
  .eq("profile_id", user.id);

 type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
 };

 const workspaces = (memberships ?? [])
  .map((m) => {
   const ws = m.workspaces as unknown as WorkspaceRow;
   return ws ? { ...ws, shared: m.role !== "owner" } : null;
  })
  .filter(Boolean) as (WorkspaceRow & { shared: boolean })[];

 if (workspaces.length === 0) {
  redirect("/onboarding");
 }

 const { data: profile } = await supabase
  .from("profiles")
  .select("name, email, avatar_url")
  .eq("id", user.id)
  .single();

 const displayName = profile?.name ?? user.email ?? "Account";
 const displayEmail = profile?.email ?? user.email ?? "";

 const activeWorkspace = await getActiveWorkspace();
 const subscription = activeWorkspace
  ? await getWorkspaceSubscription(activeWorkspace.id)
  : null;
 const isStartup = hasStartupPlan(subscription);

 // Check if over user limit (Hobby plan only)
 let overLimitCount = 0;
 if (activeWorkspace && !isStartup) {
  overLimitCount = await countExternalUsers(activeWorkspace.id);
 }
 const isOverLimit = !isStartup && overLimitCount > PLAN_LIMITS.maxUsers;

 return (
  <div className="flex h-screen overflow-hidden">
   {/* Sidebar handles both desktop layout and mobile modal tracking natively */}
   <DashboardSidebar
    workspaces={workspaces}
    activeWorkspaceId={activeWorkspace?.id ?? null}
    displayName={displayName}
    displayEmail={displayEmail}
    avatarUrl={profile?.avatar_url ?? null}
    isStartup={isStartup}
   />

   {/* Main content */}
   <div className="flex min-w-0 flex-1 flex-col">
    <main className="flex-1 overflow-y-auto">
     
     <PageTransition>{children}</PageTransition>
    </main>
   </div>

   {/* Over-limit upgrade reminder dialog */}
   {isOverLimit && (
    <OverLimitDialog userCount={overLimitCount} limit={PLAN_LIMITS.maxUsers} />
   )}
  </div>
 );
}
