import Link from "next/link";
import { headers } from "next/headers";
import {
 ArrowRight,
 BadgeCheck,
 Code2,
 ExternalLink,
 Eye,
 Rocket,
 Users,
} from "@/components/icons";


import { createAdminClient } from "@/lib/supabase/admin";

import { getActiveWorkspace } from "@/lib/workspace";
import {
 getWorkspaceSubscription,
 hasStartupPlan,
} from "@/lib/subscription";


import { PlanBanner } from "@/components/plan-banner";
import { EmbedSnippet } from "./snippet";
import { LogoUploader } from "./logo-uploader";

import { SurfaceToggle } from "./surface-toggle";
import { WorkspaceEditor } from "./workspace-editor";
import { WidgetAppearance } from "./widget-appearance";



import {
 EditorsManager,
 type EditorMember,
 type PendingInvite,
} from "./editors-manager";


export const metadata = {
 title: "Settings — Pittstop",
};

export default async function SettingsPage() {
 const workspace = await getActiveWorkspace();

 if (!workspace) {

  return (
   <div className="mx-auto w-full max-w-3xl px-6 py-10">
    <div className="rounded-md  border border-border border-dashed p-10 text-center">
     <h1 className="text-sm font-medium">No active workspace</h1>
    </div>
   </div>
  );
 }

 // Derive the public origin (works behind proxies in production).
 const h = await headers();
 const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
 const proto =
  h.get("x-forwarded-proto") ??
  (host.startsWith("localhost") ? "http" : "https");
 const origin =
  process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

 // Editors: current members + pending email invites.
 // Use the admin client: RLS (profiles_select_own) only lets a user read their
 // OWN profile, so a session-client join would return blank name/email for
 // every other member. Membership is already scoped to this workspace.
 const supabase = createAdminClient();
 const canManage = workspace.role === "owner" || workspace.role === "admin";

 // Current subscription for the Plan section.
 const subscription = await getWorkspaceSubscription(workspace.id);
 const hasPlan = hasStartupPlan(subscription);


 const { data: memberRows } = await supabase
  .from("workspace_members")
  .select("role, profile_id, profiles ( name, email )")
  .eq("workspace_id", workspace.id)
  .order("created_at", { ascending: true });

 const members: EditorMember[] = (memberRows ?? []).map((m) => {
  const raw = m.profiles as unknown;
  const p = (Array.isArray(raw) ? raw[0] : raw) as
   | { name: string | null; email: string }
   | undefined;
  return {
   profile_id: m.profile_id as string,
   name: p?.name ?? null,
   email: p?.email ?? "",
   role: m.role as string,
  };
 });


 const { data: inviteRows } = await supabase
  .from("workspace_invites")
  .select("id, email")
  .eq("workspace_id", workspace.id)
  .order("created_at", { ascending: true });

 const invites: PendingInvite[] = (inviteRows ?? []) as PendingInvite[];




 return (

  <div className="mx-auto w-full max-w-3xl px-6 py-10">
   <div className="mb-8">
    {/* <p className="font-mono text-xs text-muted-foreground">/settings</p> */}
    <h1 className="mt-1 text-4xl font-semibold tracking-tight">Settings</h1>
    <p className="mt-1 text-sm text-muted-foreground">
     Configure your workspace and install the in-app widget.
    </p>
   </div>

   <PlanBanner page="settings" />

   {/* Workspace info */}
   <section className="mb-10">
    <h2 className="mb-3 text-sm font-semibold">Workspace</h2>

    <WorkspaceEditor
     initialName={workspace.name}
     initialSlug={workspace.slug}
     canManage={canManage}
    />


    {/* Company logo */}
    <div className="mt-2 rounded-b-xl  border border-border border-t-0 bg-card rounded-t-xl p-4">
     <p className="mb-3 font-mono text-xs text-muted-foreground">logo</p>
     <LogoUploader
      workspaceName={workspace.name}
      initialUrl={workspace.logo_url}
     />
    </div>
   </section>


   {/* Plan / subscription */}
   <section className="mb-10">
    <div className="mb-3 flex items-center gap-2">
     <Rocket className="size-4 text-muted-foreground" />
     <h2 className="text-sm font-semibold">Plan</h2>
    </div>
    <Link
     href="/subscriptions/plan"
     className="group flex items-center justify-between gap-4 rounded-md  border border-border bg-card p-4 transition-colors hover:border-foreground/20"
    >
     <div className="flex items-center gap-3">
      <div
       className={
        "flex size-9 shrink-0 items-center justify-center rounded-full " +
        (hasPlan
         ? "bg-primary/10 text-primary"
         : "bg-secondary text-muted-foreground")
       }
      >
       {hasPlan ? (
        <BadgeCheck className="size-5" />
       ) : (
        <Rocket className="size-5" />
       )}
      </div>
      <div>
       <p className="text-sm font-medium">
        {hasPlan ? "You have Startup plan" : "Free plan"}
       </p>
       <p className="text-xs text-muted-foreground">
        {hasPlan
         ? "Manage your subscription for this workspace."
         : "Upgrade to the Startup plan to unlock everything."}
       </p>
      </div>
     </div>
     <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors group-hover:text-foreground">
      {hasPlan ? "manage plan" : "upgrade plan"}
      <ArrowRight className="size-3" />
     </span>
    </Link>
   </section>


   {/* Editors / team */}
   <section className="mb-10">
    <div className="mb-3 flex items-center gap-2">
     <Users className="size-4 text-muted-foreground" />
     <h2 className="text-sm font-semibold">Editors</h2>
    </div>

    <p className="mb-4 max-w-prose text-sm text-muted-foreground">
     Invite teammates by email. When they sign in, this workspace appears
     in their switcher labelled{" "}
     <span className="font-mono text-foreground">(shared)</span>.
    </p>
    <EditorsManager
     canManage={canManage}
     members={members}
     invites={invites}
    />
   </section>


   {/* Public surface visibility */}
   <section className="mb-10">
    <div className="mb-3 flex items-center gap-2">
     <Eye className="size-4 text-muted-foreground" />
     <h2 className="text-sm font-semibold">Public visibility</h2>
    </div>
    <p className="mb-4 max-w-prose text-sm text-muted-foreground">
     Control which surfaces visitors can see. Turning one off returns a 404
     on its public page and removes it from the widget — your data is
     preserved and reappears the moment you switch it back on.
    </p>
    <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
     <SurfaceToggle
      surface="boards"
      label="Boards"
      description="Toggle if Boards are visible on your public page"
      initialEnabled={workspace.boards_enabled}
      canManage={canManage}
     />
     <SurfaceToggle
      surface="roadmap"
      label="Roadmap"
      description="Toggle if Roadmaps are visible on your public page"
      initialEnabled={workspace.roadmap_enabled}
      canManage={canManage}
     />
     <SurfaceToggle
      surface="changelog"
      label="Changelog"
      description="Toggle if Changelogs are visible on your public page"
      initialEnabled={workspace.changelog_enabled}
      canManage={canManage}
     />
    </div>
   </section>



   {/* Embed widget */}
   <section>

    <div className="mb-3 flex items-center gap-2">
     <Code2 className="size-4 text-muted-foreground" />
     <h2 className="text-sm font-semibold">In-app widget</h2>
    </div>

    <p className="mb-4 max-w-prose text-sm text-muted-foreground">
     Drop this snippet into your product&apos;s HTML (right before the
     closing <code className="font-mono text-foreground">&lt;/body&gt;</code>{" "}
     tag) to add a floating feedback drawer. It loads asynchronously and
     won&apos;t block your page.
    </p>

    <EmbedSnippet
     origin={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
     workspaceSlug={workspace.slug}
    />

    {/* Widget appearance */}
    


    {/* <a
     href={`/widget/${workspace.slug}`}

     target="_blank"
     rel="noreferrer"
     className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
     <ExternalLink className="size-3" />
     preview widget
    </a> */}
   </section>
  </div>
 );
}
