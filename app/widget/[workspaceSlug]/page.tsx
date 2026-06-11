import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRoadmapPosts } from "@/lib/roadmap";
import { WidgetShell, type WidgetBoardInfo } from "./widget-board";
import { type PublicPost } from "@/app/public/[workspaceSlug]/[boardSlug]/feedback-board";

type PageParams = { workspaceSlug: string };
type SearchParams = { view?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  return {
    title: `${workspaceSlug} — Feedback`,
    robots: { index: false },
  };
}

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { workspaceSlug } = await params;
  const { view } = await searchParams;
  const supabase = createAdminClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, changelog_enabled")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) notFound();

  // All public boards in the workspace — the widget lets the visitor switch
  // between them, mirroring the full public site.
  const { data: boardsRaw } = await supabase
    .from("boards")
    .select("id, name, slug, description, flairs")
    .eq("workspace_id", workspace.id)
    .eq("is_private", false)
    .order("created_at", { ascending: true });

  const boards = (boardsRaw ?? []).map((b) => ({
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    description: (b.description ?? null) as string | null,
    flairs: (b.flairs ?? ["feedback", "bug"]) as string[],
  })) as WidgetBoardInfo[];

  const boardIds = boards.map((b) => b.id);

  // Posts across every public board, grouped client-side by board_id.
  const postsByBoard: Record<string, PublicPost[]> = {};
  for (const b of boards) postsByBoard[b.id] = [];

  if (boardIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select(
        "id, board_id, title, description, status, upvotes_count, flair, created_at"
      )
      .in("board_id", boardIds)
      .order("upvotes_count", { ascending: false })
      .order("created_at", { ascending: false });

    for (const p of (posts ?? []) as (PublicPost & { board_id: string })[]) {
      (postsByBoard[p.board_id] ??= []).push(p);
    }
  }

  // Roadmap (planned / in-progress / completed) across the workspace.
  const roadmap = await getRoadmapPosts(workspace.id);

  // Recent published changelog entries (only when the changelog is enabled).
  const changelogEnabled = workspace.changelog_enabled !== false;
  const { data: changelogs } = changelogEnabled
    ? await supabase
        .from("changelogs")
        .select("id, title, content, published_at")
        .eq("workspace_id", workspace.id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(20)
    : { data: [] };

  return (
    <WidgetShell
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
      view={view ?? "all"}
      changelogEnabled={changelogEnabled}
      boards={boards}
      postsByBoard={postsByBoard}
      roadmap={roadmap}
      changelogs={
        (changelogs ?? []) as {
          id: string;
          title: string;
          content: string;
          published_at: string;
        }[]
      }
    />
  );
}
