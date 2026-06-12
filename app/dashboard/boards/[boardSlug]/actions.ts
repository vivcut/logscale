"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceSubscription, hasStartupPlan } from "@/lib/subscription";
import { DEFAULT_FLAIR, normalizeFlair } from "@/lib/flairs";



const VALID_STATUSES = [
  "under-review",
  "planned",
  "in-progress",
  "completed",
  "closed",
] as const;

export type AdminActionState = { ok: boolean; error?: string };

/**
 * Confirms the active user is an owner/admin of the workspace that owns the
 * given board, and returns the supabase client + board id. Throws (via the
 * returned error) otherwise. Central guard for every mutation below.
 */
async function authorizeBoard(boardSlug: string) {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { error: "No active workspace." as const };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { error: "Insufficient permissions." as const };
  }

  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("slug", boardSlug)
    .maybeSingle();

  if (!board) return { error: "Board not found." as const };

  return { supabase, boardId: board.id, workspaceSlug: workspace.slug };
}

/** Confirms a post belongs to the given board (cross-tenant safety). */
async function postBelongsToBoard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string,
  boardId: string
) {
  const { data } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("board_id", boardId)
    .maybeSingle();
  return !!data;
}

export async function updatePostStatus(
  boardSlug: string,
  postId: string,
  status: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };

  if (!VALID_STATUSES.includes(status as never)) {
    return { ok: false, error: "Invalid status." };
  }
  if (!(await postBelongsToBoard(auth.supabase, postId, auth.boardId))) {
    return { ok: false, error: "Post not found." };
  }

  // Only log a timeline event when the status actually changes.
  const { data: existing } = await auth.supabase
    .from("posts")
    .select("status")
    .eq("id", postId)
    .single();

  const { error } = await auth.supabase
    .from("posts")
    .update({ status })
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };

  if (!existing || existing.status !== status) {
    // Append-only timeline so the public detail page can show dated history.
    // Use the service-role client: there is no INSERT RLS policy on
    // post_status_events (it's public-read only), so the session client would
    // be silently blocked and the timeline would never persist.
    const admin = createAdminClient();
    await admin
      .from("post_status_events")
      .insert({ post_id: postId, status });
  }


  // Status changes feed the roadmap too.
  revalidatePath(`/dashboard/boards/${boardSlug}`);
  revalidatePath("/dashboard/roadmap");
  return { ok: true };
}


export async function saveAdminNotes(
  boardSlug: string,
  postId: string,
  notes: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!(await postBelongsToBoard(auth.supabase, postId, auth.boardId))) {
    return { ok: false, error: "Post not found." };
  }

  const { error } = await auth.supabase
    .from("posts")
    .update({ admin_notes: notes || null })
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/boards/${boardSlug}`);
  return { ok: true };
}

export async function savePinnedResponse(
  boardSlug: string,
  postId: string,
  response: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!(await postBelongsToBoard(auth.supabase, postId, auth.boardId))) {
    return { ok: false, error: "Post not found." };
  }

  const { error } = await auth.supabase
    .from("posts")
    .update({ pinned_response: response || null })
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/boards/${boardSlug}`);
  return { ok: true };
}

export async function mergePosts(
  boardSlug: string,
  sourceId: string,
  targetId: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };

  if (sourceId === targetId) {
    return { ok: false, error: "Cannot merge a post into itself." };
  }
  // Both posts must be on this board.
  if (
    !(await postBelongsToBoard(auth.supabase, sourceId, auth.boardId)) ||
    !(await postBelongsToBoard(auth.supabase, targetId, auth.boardId))
  ) {
    return { ok: false, error: "Both posts must be on this board." };
  }

  const { error } = await auth.supabase.rpc("merge_post", {
    source_id: sourceId,
    target_id: targetId,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/boards/${boardSlug}`);
  return { ok: true };
}

export async function deletePost(
  boardSlug: string,
  postId: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };
  if (!(await postBelongsToBoard(auth.supabase, postId, auth.boardId))) {
    return { ok: false, error: "Post not found." };
  }

  const { error } = await auth.supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/boards/${boardSlug}`);
  return { ok: true };
}

export async function createInternalPost(
  boardSlug: string,
  title: string,
  description: string,
  category: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };

  if (!title.trim()) return { ok: false, error: "Title is required." };

  // Use the service-role client: there is no INSERT RLS policy on posts (public
  // submissions go through the admin API route), so the session client would be
  // blocked here — which surfaced as the "row-level security policy" error when
  // creating an internal post on a PRIVATE board. Authorization is already
  // enforced by authorizeBoard() above.
  const admin = createAdminClient();
  const { error } = await admin.from("posts").insert({
    board_id: auth.boardId,
    title: title.trim(),
    description: description.trim() || null,
    category: category.trim() || null,
    status: "under-review",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/boards/${boardSlug}`);
  return { ok: true };
}

/**
 * Saves the board's flair set. Custom flairs are a Startup-plan feature: Hobby
 * workspaces are locked to the single default "general" flair. Owners/admins on
 * the Startup plan can add/remove any flairs, but the default flair is always
 * kept so every post can be tagged.
 */
export async function saveBoardFlairs(
  boardSlug: string,
  flairs: string[]
): Promise<AdminActionState & { flairs?: string[] }> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };

  // Normalise + de-dupe, preserving the owner's chosen order.
  const next = Array.from(
    new Set(
      flairs
        .map((f) => normalizeFlair(f))
        .filter((f) => f.length > 0 && f.length <= 24)
    )
  );

  // A board must always keep at least one flair so posts can be tagged.
  if (next.length === 0) {
    return {
      ok: false,
      error: "Keep at least one flair so people can tag their posts.",
    };
  }

  // Custom flairs require the Startup plan. Hobby workspaces are locked to the
  // single default "general" flair (no custom flairs, no renaming/removing it).
  const subscription = await getWorkspaceSubscription(workspace.id);
  if (
    !hasStartupPlan(subscription) &&
    (next.length > 1 || next[0] !== DEFAULT_FLAIR)
  ) {
    return {
      ok: false,
      error:
        "Custom post flairs are a Startup plan feature. Upgrade to add your own flairs.",
    };
  }


  const { error } = await auth.supabase
    .from("boards")
    .update({ flairs: next })
    .eq("id", auth.boardId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/boards/${boardSlug}`);
  return { ok: true, flairs: next };
}


/**
 * Toggles a board between public and private. Returns the new visibility so the
 * client can reflect the change without a full reload.
 */
export async function setBoardPrivacy(
  boardSlug: string,
  isPrivate: boolean
): Promise<AdminActionState & { isPrivate?: boolean }> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("boards")
    .update({ is_private: isPrivate })
    .eq("id", auth.boardId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/boards/${boardSlug}`);
  revalidatePath("/dashboard/boards");
  return { ok: true, isPrivate };
}

/**
 * Permanently deletes a board and everything attached to it (posts, upvotes,
 * comments cascade via FKs). Owners/admins only.
 */
export async function deleteBoard(

  boardSlug: string
): Promise<AdminActionState> {
  const auth = await authorizeBoard(boardSlug);
  if ("error" in auth) return { ok: false, error: auth.error };

  const { error } = await auth.supabase
    .from("boards")
    .delete()
    .eq("id", auth.boardId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/boards");
  return { ok: true };
}

