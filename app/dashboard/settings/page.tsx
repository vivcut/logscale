import { headers } from "next/headers";
import { Code2, ExternalLink, Sparkles, Users } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

import { EmbedSnippet } from "./snippet";
import { LogoUploader } from "./logo-uploader";
import { ChangelogToggle } from "./changelog-toggle";

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
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          <div className="bg-card p-4">
            <p className="font-mono text-xs text-muted-foreground">name</p>
            <p className="mt-1 text-sm">{workspace.name}</p>
          </div>
          <div className="bg-card p-4">
            <p className="font-mono text-xs text-muted-foreground">slug</p>
            <p className="mt-1 font-mono text-sm">{workspace.slug}</p>
          </div>
        </div>

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


      {/* Public changelog visibility */}
      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Changelog</h2>
        </div>
        <p className="mb-4 max-w-prose text-sm text-muted-foreground">
          Control whether your public changelog is visible. When off, the page
          returns a 404 and links to it are hidden.
        </p>
        <ChangelogToggle
          initialEnabled={workspace.changelog_enabled}
          canManage={canManage}
        />
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

        <EmbedSnippet origin={origin} workspaceSlug={workspace.slug} />

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
