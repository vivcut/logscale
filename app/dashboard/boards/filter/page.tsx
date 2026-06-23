import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { BoardsFilterView } from "@/components/boards-filter-view";

export const metadata = {
  title: "Filter Posts — Pittstop",
};

export default async function AdminBoardsFilterPage() {
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-md border border-border border-dashed p-10 text-center">
          <h1 className="text-sm font-medium">No active workspace</h1>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Get all boards for this workspace
  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, slug, flairs")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  // Collect unique flairs
  const allFlairs = Array.from(
    new Set(
      (boards ?? []).flatMap((r: { flairs: string[] | null }) => r.flairs ?? [])
    )
  );

  const boardOptions = (boards ?? []).map((b: { id: string; name: string; slug: string }) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Filter & Explore Posts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search, filter, and sort across all your boards.
        </p>
      </div>
      <BoardsFilterView
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        boards={boardOptions}
        flairs={allFlairs}
      />
    </div>
  );
}
