import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceSubscription, hasStartupPlan, countExternalUsers, PLAN_LIMITS } from "@/lib/subscription";
import { PublicNavbar, type NavUser, type NavWorkspace } from "@/components/public-navbar";
import { FrozenOverlay } from "@/components/frozen-overlay";

type LayoutParams = {
 workspaceSlug: string;
};

export default async function PublicLayout({
 children,
 params,
}: {
 children: React.ReactNode;
 params: Promise<LayoutParams>;
}) {
 const { workspaceSlug } = await params;
 const supabase = createAdminClient();

 const { data: workspace } = await supabase
  .from("workspaces")
  .select("id, name, slug, logo_url, boards_enabled, roadmap_enabled, changelog_enabled")
  .eq("slug", workspaceSlug)
  .single();

 if (!workspace) notFound();

 // Get current user session
 let navUser: NavUser | null = null;
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();

 if (user) {
  // Check if user is an admin/editor of this workspace
  const { data: membership } = await supabase
   .from("workspace_members")
   .select("role")
   .eq("workspace_id", workspace.id)
   .eq("profile_id", user.id)
   .maybeSingle();

  const { data: profile } = await supabase
   .from("profiles")
   .select("name, avatar_url")
   .eq("id", user.id)
   .single();

  navUser = {
   name: profile?.name ?? null,
   email: user.email ?? "",
   avatarUrl: profile?.avatar_url ?? null,
   isAdmin: !!membership,
  };
 }

 // Check subscription to determine if watermark/brand should be passed on sign-out
 const subscription = await getWorkspaceSubscription(workspace.id);
 const isStartup = hasStartupPlan(subscription);

 // Check if workspace is over limit (Hobby plan only) — freeze public pages
 let isFrozen = false;
 if (!isStartup) {
  const externalUsers = await countExternalUsers(workspace.id);
  isFrozen = externalUsers > PLAN_LIMITS.maxUsers;
 }

 const navWorkspace: NavWorkspace = {
  name: workspace.name,
  slug: workspace.slug,
  logoUrl: workspace.logo_url,
  boardsEnabled: workspace.boards_enabled ?? false,
  roadmapEnabled: workspace.roadmap_enabled ?? false,
  changelogEnabled: workspace.changelog_enabled ?? false,
  isStartup,
 };

 return (
  <div className="min-h-screen">
   <PublicNavbar workspace={navWorkspace} user={navUser} />
   {children}
   {isFrozen && <FrozenOverlay workspaceName={workspace.name} />}
  </div>
 );
}
