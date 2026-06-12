import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { claimPendingInvites } from "@/lib/invites";
import { SignOutButton } from "./sign-out-button";
import { DashboardSidebar } from "./sidebar";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: the proxy guards this too, but never trust a single layer.
  if (!user) {
    redirect("/login");
  }

  // Claim any workspace invites addressed to this user's email (turns pending
  // invites into memberships so shared workspaces show up immediately).
  await claimPendingInvites(user.id, user.email ?? "");

  // Multi-tenant isolation: only fetch workspaces this user is a member of.
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

  // A workspace is "shared" when the user isn't its owner.
  const workspaces = (memberships ?? [])
    .map((m) => {
      const ws = m.workspaces as unknown as WorkspaceRow;
      return ws ? { ...ws, shared: m.role !== "owner" } : null;
    })
    .filter(Boolean) as (WorkspaceRow & { shared: boolean })[];


  // No workspaces yet → force the onboarding setup flow.
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (client component — collapsible + theme toggle) */}
      <DashboardSidebar
        workspaces={workspaces}
        displayName={displayName}
        displayEmail={displayEmail}
        avatarUrl={profile?.avatar_url ?? null}
      />

      {/* Main content */}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-6 md:hidden">
          <span className="font-mono text-sm font-semibold">tothemoon</span>
          <SignOutButton />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
