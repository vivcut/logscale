"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

const WORKER_ENDPOINT =
  "https://summer-cherry-c965.vivaancut.workers.dev/";

export type ChangelogState = {
  ok: boolean;
  error?: string;
};

/**
 * Creates or updates a changelog entry, scoped to the active workspace.
 * If `publish` is true, stamps `published_at`; otherwise saves as a draft.
 */
export async function saveChangelog(
  _prev: ChangelogState,
  formData: FormData
): Promise<ChangelogState> {
  const supabase = await createClient();

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to publish." };
  }

  const id = String(formData.get("id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const publish = formData.get("publish") === "true";

  if (!title) return { ok: false, error: "Title is required." };
  if (!content) return { ok: false, error: "Content is required." };

  const publishedAt = publish ? new Date().toISOString() : null;

  if (id) {
    // Update existing — scope to workspace to prevent cross-tenant edits.
    const payload: Record<string, unknown> = { title, content };
    if (publish) payload.published_at = publishedAt;

    const { error } = await supabase
      .from("changelogs")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", workspace.id);

    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("changelogs").insert({
      workspace_id: workspace.id,
      title,
      content,
      published_at: publishedAt,
    });

    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/changelog");
  redirect("/dashboard/changelog");
}

export async function deleteChangelog(
  _prev: ChangelogState,
  formData: FormData
): Promise<ChangelogState> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing id." };

  const { error } = await supabase
    .from("changelogs")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/changelog");
  return { ok: true };
}

export type AiDraftResult = {
  ok: boolean;
  markdown?: string;
  error?: string;
};

/**
 * Generates an AI changelog draft from recently completed feedback.
 *
 * Pipeline:
 *  1. Find all posts in the active workspace whose status is 'completed'
 *     and whose created_at falls within the last 14 days.
 *  2. Map them down to { title, description }.
 *  3. POST { features: [...] } to the Cloudflare Workers AI endpoint.
 *  4. Return the { markdown } string for injection into the editor.
 */
export async function generateAiDraft(): Promise<AiDraftResult> {
  const supabase = await createClient();

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };

  // Collect board ids for the workspace (tenant scoping).
  const { data: boards } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id);

  const boardIds = (boards ?? []).map((b) => b.id);
  if (boardIds.length === 0) {
    return { ok: false, error: "No boards found in this workspace." };
  }

  // Pull the most recently shipped work. We intentionally do NOT filter by
  // `created_at` here: a post is usually completed long after it was first
  // submitted, so filtering on creation date silently drops freshly shipped
  // features. Instead we take the latest completed posts and cap the count so
  // the prompt stays within the model's context window.
  const { data: posts, error } = await supabase
    .from("posts")
    .select("title, description, created_at")
    .in("board_id", boardIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return { ok: false, error: error.message };

  const features = (posts ?? []).map((p) => ({
    title: p.title,
    description: p.description ?? "",
  }));

  if (features.length === 0) {
    return {
      ok: false,
      error:
        "No completed features to summarize yet. Mark some posts as 'completed' on your boards first.",
    };
  }


  try {
    const res = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        error: `AI worker responded ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as { markdown?: string; error?: string };
    if (json.error) return { ok: false, error: json.error };
    if (!json.markdown) {
      return { ok: false, error: "AI worker returned no markdown." };
    }

    return { ok: true, markdown: json.markdown };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to reach AI worker.",
    };
  }
}
