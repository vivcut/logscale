import Link from "next/link";
import {
 ArrowRight,
 GitBranch,
 MessageSquare,
 Sparkles,
} from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { PlanBanner } from "@/components/plan-banner";

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
    <h1 className="mt-1 text-4xl font-[600] tracking-[0.15em">
     Welcome back, {firstName}
    </h1>
    <p className="mt-3 text-xl text-muted-foreground">
     A quick snapshot of your workspace.
    </p>
   </div>

   <PlanBanner page="overview" />

   {/* Row-by-row list layout */}
   <div className="mt-6 divide-y divide- border-2 border-border rounded-xl  border-2 border-border bg-card overflow-hidden">
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