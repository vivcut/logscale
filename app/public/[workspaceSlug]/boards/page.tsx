import { createAdminClient } from "@/lib/supabase/admin";
import { BoardsFilterView } from "@/components/boards-filter-view";
import { notFound } from "next/navigation";

export default async function PublicBoardsFilterPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const admin = createAdminClient();

  // Resolve workspace
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) return notFound();

  // Get all public boards
  const { data: boards } = await admin
    .from("boards")
    .select("id, name, slug")
    .eq("workspace_id", workspace.id)
    .eq("is_private", false);

  // Collect unique flairs from all boards
  const { data: flairRows } = await admin
    .from("boards")
    .select("flairs")
    .eq("workspace_id", workspace.id)
    .eq("is_private", false);

  const allFlairs = Array.from(
    new Set(
      (flairRows ?? []).flatMap((r: { flairs: string[] | null }) => r.flairs ?? [])
    )
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">All Boards — Filter View</h1>
      <BoardsFilterView
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        boards={boards ?? []}
        flairs={allFlairs}
      />
    </div>
  );
}
