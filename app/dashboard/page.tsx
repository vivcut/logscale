import Link from "next/link";
import { GitBranch, MessageSquare, Plus, Sparkles, Users } from "@/components/icons";


import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import {
  OverviewBoards,
  type OverviewBoard,
  type OverviewPost,
} from "./overview-boards";


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

  // Defaults for the empty/no-workspace case.
  let openPosts = 0;
  let inProgress = 0;
  let shipped = 0;
  let members = 1;
  let boards: OverviewBoard[] = [];
  let recent: OverviewPost[] = [];

  if (workspace) {
    // Boards in this workspace (need name + slug for the switcher + links).
    const { data: boardRows } = await supabase
      .from("boards")
      .select("id, name, slug")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true });
    boards = (boardRows ?? []) as OverviewBoard[];
    const boardIds = boards.map((b) => b.id);

    // Member count.
    const { count: memberCount } = await supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);
    members = memberCount ?? 1;

    if (boardIds.length > 0) {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, title, status, upvotes_count, board_id, created_at")
        .in("board_id", boardIds)
        .order("upvotes_count", { ascending: false })
        .order("created_at", { ascending: false });

      const list = (posts ?? []) as (OverviewPost & { created_at: string })[];
      openPosts = list.filter(
        (p) => p.status === "under-review" || p.status === "planned"
      ).length;
      inProgress = list.filter((p) => p.status === "in-progress").length;
      shipped = list.filter((p) => p.status === "completed").length;
      recent = list;
    }
  }


  const stats = [
    { label: "open_posts", value: openPosts, icon: MessageSquare },
    { label: "in_progress", value: inProgress, icon: GitBranch },
    { label: "shipped", value: shipped, icon: Sparkles },
    { label: "members", value: members, icon: Users },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">/overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your workspace.
          </p>
        </div>
        <Link
          href="/dashboard/boards"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70"
        >
          <Plus className="size-4" />
          New board
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                {s.label}
              </span>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {recent.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-secondary">
            <MessageSquare className="size-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-sm font-medium">No feedback yet</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first board to start collecting feature requests from
            your users.
          </p>
          <Link
            href="/dashboard/boards"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/70"
          >
            <Plus className="size-4" />
            Create a board
          </Link>
        </div>
      ) : (
        <OverviewBoards
          workspaceSlug={workspace!.slug}
          boards={boards}
          posts={recent}
        />
      )}

    </div>
  );
}
