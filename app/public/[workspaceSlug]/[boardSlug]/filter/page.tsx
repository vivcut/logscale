import { createAdminClient } from "@/lib/supabase/admin";
import { BoardsFilterView } from "@/components/boards-filter-view";
import { notFound } from "next/navigation";

export default async function BoardFilterPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardSlug: string }>;
}) {
  const { workspaceSlug, boardSlug } = await params;
  const admin = createAdminClient();

  // Resolve workspace
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) return notFound();

  // Resolve specific board
  const { data: board } = await admin
    .from("boards")
    .select("id, name, slug, flairs")
    .eq("workspace_id", workspace.id)
    .eq("slug", boardSlug)
    .eq("is_private", false)
    .single();

  if (!board) return notFound();

  // Get all public boards for context
  const { data: boards } = await admin
    .from("boards")
    .select("id, name, slug")
    .eq("workspace_id", workspace.id)
    .eq("is_private", false);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {board.name} — Filter View
      </h1>
      <BoardsFilterView
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        boards={boards ?? []}
        flairs={(board.flairs ?? []) as string[]}
        boardId={board.id}
        boardSlug={board.slug}
      />
    </div>
  );
}
