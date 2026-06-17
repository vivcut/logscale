import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const workspace = await getActiveWorkspace();
  // Ensure workspace has a slug (fallback to its ID if not)
  const workspaceSlug = workspace?.slug || workspace?.id;

  if (!workspace) {
    return NextResponse.json({ error: "No active workspace." }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. Fetch both ID and slug for the boards in this workspace
  const { data: boards } = await supabase
    .from("boards")
    .select("id, slug")
    .eq("workspace_id", workspace.id);

  const boardMap = new Map((boards ?? []).map((b) => [b.id, b.slug]));
  const boardIds = Array.from(boardMap.keys());

  if (boardIds.length === 0) {
    return NextResponse.json({ workspaceSlug, posts: [] });
  }

  // 2. Fetch up to 3 under-review posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, description, upvotes_count, board_id")
    .in("board_id", boardIds)
    .eq("status", "under-review")
    .order("upvotes_count", { ascending: false })
    .limit(3);

  const list = (posts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    upvotes: p.upvotes_count,
    boardSlug: boardMap.get(p.board_id) || "general", // Fallback string if slug is empty
  }));

  return NextResponse.json({ workspaceSlug, posts: list });
}