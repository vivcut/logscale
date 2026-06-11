import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ClipboardList,
  GitBranch,
  LayoutGrid,
  Mail,
  MessageSquare,
  Settings,
  Sparkles,
} from "@/components/icons";



import { createClient } from "@/lib/supabase/server";
import { claimPendingInvites } from "@/lib/invites";
import { SignOutButton } from "./sign-out-button";
import { WorkspaceSwitcher } from "./workspace-switcher";


const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/boards", label: "Boards", icon: MessageSquare },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: GitBranch },
  { href: "/dashboard/changelog", label: "Changelog", icon: Sparkles },
  { href: "/dashboard/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/dashboard/status", label: "Status", icon: Activity },
  { href: "/dashboard/contact-page", label: "Contact", icon: Mail },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },


];

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
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <WorkspaceSwitcher workspaces={workspaces} />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          <span className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            workspace
          </span>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Account */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-medium">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="size-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

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
