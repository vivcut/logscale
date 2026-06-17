import { createAdminClient } from "@/lib/supabase/admin";

export type RoadmapPostRow = {
 id: string;
 title: string;
 description: string | null;
 status: string;
 upvotes_count: number;
};

const ROADMAP_STATUSES = ["planned", "in-progress", "completed"];

/**
 * Fetches roadmap posts (planned / in-progress / completed) for every board
 * within a workspace. Used by both the internal dashboard roadmap and the
 * public roadmap view.
 */
export async function getRoadmapPosts(
 workspaceId: string
): Promise<RoadmapPostRow[]> {
 const supabase = createAdminClient();

 const { data: boards } = await supabase
  .from("boards")
  .select("id")
  .eq("workspace_id", workspaceId);

 const boardIds = (boards ?? []).map((b) => b.id);
 if (boardIds.length === 0) return [];

 const { data: posts } = await supabase
  .from("posts")
  .select("id, title, description, status, upvotes_count")
  .in("board_id", boardIds)
  .in("status", ROADMAP_STATUSES)
  .order("upvotes_count", { ascending: false });

 return (posts ?? []) as RoadmapPostRow[];
}
