import { headers } from "next/headers";
import { Code2, ExternalLink, Eye, Users } from "@/components/icons";


import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

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
  title: "Settings — ToTheMoon",
};

export default async function SettingsPage() {
  const workspace = await getActiveWorkspace();

  if (!workspace) {

    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
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

  // Public boards + published surveys — used to offer per-item embed views
  // (e.g. "Board - Feature requests", "Survey - Customer support").
  const { data: boardRows } = await supabase
    .from("boards")
    .select("name, slug")
    .eq("workspace_id", workspace.id)
    .eq("is_private", false)
    .order("created_at", { ascending: true });

  const { data: surveyRows } = await supabase
    .from("surveys")
    .select("title, slug")
    .eq("workspace_id", workspace.id)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  const embedBoards = (boardRows ?? []).map((b) => ({
    name: b.name as string,
    slug: b.slug as string,
  }));
  const embedSurveys = (surveyRows ?? []).map((s) => ({
    name: s.title as string,
    slug: s.slug as string,
  }));



  return (

    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground">/settings</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your workspace and install the in-app widget.
        </p>
      </div>

      {/* Workspace info */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold">Workspace</h2>
        <WorkspaceEditor
          initialName={workspace.name}
          initialSlug={workspace.slug}
          canManage={canManage}
        />


        {/* Company logo */}
        <div className="mt-px rounded-b-xl border border-t-0 border-border bg-card p-4">
          <p className="mb-3 font-mono text-xs text-muted-foreground">logo</p>
          <LogoUploader
            workspaceName={workspace.name}
            initialUrl={workspace.logo_url}
          />
        </div>
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
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          <SurfaceToggle
            surface="boards"
            label="Boards"
            description="Your feedback boards are live and publicly viewable."
            initialEnabled={workspace.boards_enabled}
            canManage={canManage}
          />
          <SurfaceToggle
            surface="roadmap"
            label="Roadmap"
            description="Your public roadmap is live and linked from public pages."
            initialEnabled={workspace.roadmap_enabled}
            canManage={canManage}
          />
          <SurfaceToggle
            surface="changelog"
            label="Changelog"
            description="Your changelog is live and linked from public pages."
            initialEnabled={workspace.changelog_enabled}
            canManage={canManage}
          />
          <SurfaceToggle
            surface="surveys"
            label="Surveys"
            description="Published survey links are reachable by respondents."
            initialEnabled={workspace.surveys_enabled}
            canManage={canManage}
          />
          <SurfaceToggle
            surface="status"
            label="Status page"
            description="Your public status page is live and viewable."
            initialEnabled={workspace.status_enabled}
            canManage={canManage}
          />
          <SurfaceToggle
            surface="contact"
            label="Contact page"
            description="Your public contact form is live and accepting messages."
            initialEnabled={workspace.contact_enabled}
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
          origin={origin}
          workspaceSlug={workspace.slug}
          boards={embedBoards}
          surveys={embedSurveys}
        />

        {/* Widget appearance */}
        <div className="mt-6">
          <p className="mb-1 text-sm font-medium">Appearance</p>
          <p className="mb-3 max-w-prose text-sm text-muted-foreground">
            Choose the colour scheme for the widget and its drawer.{" "}
            <span className="font-mono text-foreground">Auto</span> follows each
            visitor&apos;s system preference.
          </p>
          <WidgetAppearance
            initial={workspace.widget_theme ?? "auto"}
            canManage={canManage}
          />
        </div>


        <a
          href={`/widget/${workspace.slug}`}

          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="size-3" />
          preview widget
        </a>
      </section>
    </div>
  );
}
