"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

const VALID_STATUSES = [
  "under-review",
  "planned",
  "in-progress",
  "completed",
  "closed",
] as const;

export type RoadmapState = { ok: boolean; error?: string };

export async function updatePostStatus(
  _prev: RoadmapState,
  formData: FormData
): Promise<RoadmapState> {
  const supabase = await createClient();

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const postId = String(formData.get("post_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!postId || !VALID_STATUSES.includes(status as never)) {
    return { ok: false, error: "Invalid status." };
  }

  // Verify the post belongs to a board within the active workspace before
  // mutating — prevents cross-tenant status edits.
  const { data: boards } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id);

  const boardIds = (boards ?? []).map((b) => b.id);
  if (boardIds.length === 0) return { ok: false, error: "No boards." };

  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", postId)
    .in("board_id", boardIds);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/roadmap");
  return { ok: true };
}
