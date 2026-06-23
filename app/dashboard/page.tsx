import Link from "next/link";
import {
 ArrowRight,
 GitBranch,
 MessageSquare,
 Sparkles,
 Users,
 Warning,
} from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceSubscription, hasStartupPlan, countExternalUsers, PLAN_LIMITS } from "@/lib/subscription";
import { PlanBanner } from "@/components/plan-banner";
import { ShareLink } from "@/components/share-link";

export default async function DashboardPage() {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 const workspace = await getActiveWorkspace();

 const { data: profile } = await supabase
  .from("profiles")
  .select("name")
  .eq("id", user!.id)
  .single();

 const firstName = (profile?.name ?? "there").split(" ")[0];

 // ---- Per-app summary stats (concise) ----
 let boardCount = 0;
 let postCount = 0;
 let planned = 0;
 let inProgress = 0;
 let shipped = 0;
 let changelogCount = 0;
 let lastChangelog: string | null = null;

 if (workspace) {
  const [boardsRes, changelogRes] = await Promise.all([
   supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id),
   supabase
    .from("changelogs")
    .select("id, published_at, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false }),
  ]);

  const boardIds = (boardsRes.data ?? []).map((b) => b.id);
  boardCount = boardIds.length;

  if (boardIds.length > 0) {
   const { data: posts } = await supabase
    .from("posts")
    .select("id, status")
    .in("board_id", boardIds);
   const list = posts ?? [];
   postCount = list.length;
   planned = list.filter((p) => p.status === "planned").length;
   inProgress = list.filter((p) => p.status === "in-progress").length;
   shipped = list.filter((p) => p.status === "completed").length;
  }

  const changelogs = changelogRes.data ?? [];
  changelogCount = changelogs.length;
  lastChangelog = changelogs[0]?.created_at ?? null;
 }

 function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
   month: "short",
   day: "numeric",
  });
 }

 const apps = [
  {
   href: "/dashboard/boards",
   label: "Boards",
   icon: MessageSquare,
   contents: `${boardCount} boards, ${postCount} posts`,
  },
  {
   href: "/dashboard/roadmap",
   label: "Roadmap",
   icon: GitBranch,
   contents: `${planned} planned, ${inProgress} in progress, ${shipped} shipped`,
  },
  {
   href: "/dashboard/changelog",
   label: "Changelog",
   icon: Sparkles,
   contents: `${changelogCount} entries (Latest: ${fmtDate(lastChangelog)})`,
  },
 ];

 return (
  <div className="mx-auto w-full max-w-5xl px-6 py-10">
   <div className="mb-8">
    {/* <p className="font-mono text-xs text-muted-foreground">/overview</p> */}
     <h1 className="mt-1 text-4xl font-semibold tracking-tight">
     Welcome back, {firstName}
    </h1>
    <p className="mt-3 text-xl text-muted-foreground">
     A quick snapshot of your workspace.
    </p>
   </div>

   {workspace && (
    <div className="mb-6">
     <p className="mb-1.5 font-mono text-xs text-muted-foreground">
      public feedback page
     </p>
     <ShareLink
      url={`/public/${workspace.slug}`}
      label={`${workspace.name} feedback page`}
     />
    </div>
   )}

   <PlanBanner page="overview" />

   {/* User usage section */}
   {workspace && await (async () => {
    const subscription = await getWorkspaceSubscription(workspace.id);
    const isStartup = hasStartupPlan(subscription);
    const userCount = await countExternalUsers(workspace.id);

    if (isStartup) {
     // Startup plan: just show the count, no limit
     return (
      <div className="mt-6 rounded-md border border-border bg-card p-5">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
         <Users weight="bold" className="size-5 text-muted-foreground" />
         <span className="text-sm font-semibold">External Users</span>
        </div>
        <span className="font-mono text-sm font-medium text-muted-foreground">
         {userCount}
        </span>
       </div>
       <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        Unique users who posted or commented (excludes admins)
       </p>
      </div>
     );
    }

    // Hobby plan: show progress bar with limit
    const limit = PLAN_LIMITS.maxUsers;
    const overLimit = userCount > limit;
    const pct = Math.min((userCount / limit) * 100, 100);
    return (
     <div className={`mt-6 rounded-md border ${overLimit ? "border-red-500/50 bg-red-500/5" : "border-border bg-card"} p-5`}>
      <div className="flex items-center justify-between mb-3">
       <div className="flex items-center gap-2">
        <Users weight="bold" className="size-5 text-muted-foreground" />
        <span className="text-sm font-semibold">External Users</span>
       </div>
       <span className={`font-mono text-sm font-medium ${overLimit ? "text-red-400" : "text-muted-foreground"}`}>
        {userCount}/{limit}
       </span>
      </div>
      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
       <div
        className={`h-full rounded-full transition-all ${overLimit ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
        style={{ width: `${pct}%` }}
       />
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
       Unique users who posted or commented (excludes admins)
      </p>
      {overLimit && (
       <div className="mt-3 flex items-center gap-2">
        <Warning weight="fill" className="size-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">Over limit — your public page has been frozen. Upgrade to remove restrictions.</span>
        <Link
         href="/subscriptions/plan"
         className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
         Upgrade Plan
        </Link>
       </div>
      )}
     </div>
    );
   })()}

   {/* Row-by-row list layout */}
   <div className="mt-6 divide-y divide-border rounded-md border border-border bg-card overflow-hidden">
    {apps.map((app) => (
     <Link
      key={app.href}
      href={app.href}
      className="group flex items-center justify-between px-6 py-6 transition-colors hover:bg-secondary/40"
     >
      <div className="flex items-center gap-3 text-xl">
       <app.icon weight="bold" className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" />
       <div>
        <span className="font-semibold text-foreground">{app.label}:</span>{" "}
        <span className="text-muted-foreground tabular-nums">{app.contents}</span>
       </div>
      </div>
      <ArrowRight className="size-6 text-muted-foreground opacity-0 transition-all transform -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary" />
     </Link>
    ))}
   </div>
  </div>
 );
}