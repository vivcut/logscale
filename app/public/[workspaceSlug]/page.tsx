import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CommandPalette } from "@/components/command-palette";
import { Watermark } from "@/components/watermark";
import { PublicDashboard } from "./public-dashboard";

type PageParams = {
 workspaceSlug: string;
};

export async function generateMetadata({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { workspaceSlug } = await params;
 return {
  title: `${workspaceSlug} — Public Dashboard`,
 };
}

export default async function PublicWorkspacePage({
 params,
 searchParams,
}: {
 params: Promise<PageParams>;
 searchParams: Promise<{ tab?: string }>;
}) {
 const { workspaceSlug } = await params;
 const { tab } = await searchParams;
 const supabase = createAdminClient();

 const { data: workspace } = await supabase
  .from("workspaces")
  .select("id, name, slug, logo_url, boards_enabled, changelog_enabled, roadmap_enabled, status_enabled, contact_enabled")
  .eq("slug", workspaceSlug)
  .single();

 if (!workspace) notFound();

 // Check if at least one feature is enabled
 const hasAnyFeature =
  workspace.boards_enabled ||
  workspace.changelog_enabled ||
  workspace.roadmap_enabled ||
  workspace.status_enabled ||
  workspace.contact_enabled;

 if (!hasAnyFeature) notFound();

 // Get team info for logged-in users
 let teamName: string | null = null;
 let teamEmail: string | null = null;
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (user) {
  const { data: membership } = await supabase
   .from("workspace_members")
   .select("role")
   .eq("workspace_id", workspace.id)
   .eq("profile_id", user.id)
   .maybeSingle();
  if (membership) {
   const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();
   teamName = profile?.name ?? user.email ?? "Team";
   teamEmail = user.email ?? null;
  }
 }

 return (
  <div className="min-h-screen">
   {/* Header */}
   <header className="border-b-2 border-popover/50">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-5">
     <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-popover text-lg font-bold text-foreground">
      {workspace.logo_url ? (
       // eslint-disable-next-line @next/next/no-img-element
       <img
        src={workspace.logo_url}
        alt={workspace.name}
        className="size-full object-cover"
       />
      ) : (
       workspace.name.charAt(0).toUpperCase()
      )}
     </div>
     <div className="min-w-0 flex-1">
      <p className="font-mono text-xs text-muted-foreground">
       {workspace.name}
      </p>
      <h1 className="truncate text-lg font-semibold tracking-tight">
       Public Dashboard
      </h1>
     </div>
     <CommandPalette workspaceSlug={workspace.slug} />
    </div>
   </header>

   <main className="mx-auto max-w-7xl px-6 py-8">
    <PublicDashboard
     workspaceId={workspace.id}
     workspaceSlug={workspace.slug}
     workspaceName={workspace.name}
     changelog_enabled={workspace.changelog_enabled}
     boards_enabled={workspace.boards_enabled}
     roadmap_enabled={workspace.roadmap_enabled}
     features={{
      boards: workspace.boards_enabled,
      changelog: workspace.changelog_enabled,
      roadmap: workspace.roadmap_enabled,
      status: workspace.status_enabled,
      contact: workspace.contact_enabled,
     }}
     teamName={teamName}
     teamEmail={teamEmail}
     initialTab={tab}
    />
    <Watermark workspaceId={workspace.id} />
   </main>
  </div>
 );
}
