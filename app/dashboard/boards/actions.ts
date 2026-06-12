"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import {
  getWorkspaceSubscription,
  hasStartupPlan,
  PLAN_LIMITS,
} from "@/lib/subscription";


export type BoardActionState = {
  ok: boolean;
  error?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBoard(
  _prev: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const supabase = await createClient();

  // Always verify auth + membership inside the action (never trust the client).
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return { ok: false, error: "No active workspace found." };
  }
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to create boards." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isPrivate = formData.get("is_private") === "on";

  if (!name) {
    return { ok: false, error: "Board name is required." };
  }

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return { ok: false, error: "Please provide a valid slug." };
  }

  // Hobby plan limit: at most PLAN_LIMITS.maxBoards boards per workspace.
  const subscription = await getWorkspaceSubscription(workspace.id);
  if (!hasStartupPlan(subscription)) {
    const { count } = await supabase
      .from("boards")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);
    if ((count ?? 0) >= PLAN_LIMITS.maxBoards) {
      return {
        ok: false,
        error: `The Hobby plan is limited to ${PLAN_LIMITS.maxBoards} board. Upgrade to the Startup plan for unlimited boards.`,
      };
    }
  }

  const { error } = await supabase.from("boards").insert({

    workspace_id: workspace.id, // strict tenant scoping
    name,
    slug,
    description: description || null,
    is_private: isPrivate,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A board with that slug already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/boards");
  return { ok: true };
}

export async function deleteBoard(
  _prev: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return { ok: false, error: "No active workspace found." };
  }

  const boardId = String(formData.get("board_id") ?? "");
  if (!boardId) return { ok: false, error: "Missing board id." };

  // Scope the delete to the active workspace so a user can't delete
  // a board belonging to another tenant.
  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId)
    .eq("workspace_id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/boards");
  return { ok: true };
}
