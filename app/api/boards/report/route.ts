import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

const WORKER_ENDPOINT = "https://summer-cherry-c965.vivaancut.workers.dev/";

/**
 * Generates the "most important features" report for the active workspace.
 *
 * Pulls the top 3 most-upvoted `under-review` posts across all boards and asks
 * the AI worker (mode: "report") for an actionable build recommendation.
 * Returns { markdown } or { empty: true } when there's nothing under review.
 */
export async function GET() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return NextResponse.json({ error: "No active workspace." }, { status: 401 });
  }

  const supabase = await createClient();

  // Boards in this workspace (strict tenant scoping).
  const { data: boards } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id);

  const boardIds = (boards ?? []).map((b) => b.id as string);
  if (boardIds.length === 0) {
    return NextResponse.json({ empty: true });
  }

  // Top 3 under-review posts by upvotes.
  const { data: posts } = await supabase
    .from("posts")
    .select("title, description, upvotes_count")
    .in("board_id", boardIds)
    .eq("status", "under-review")
    .order("upvotes_count", { ascending: false })
    .limit(3);

  const list = (posts ?? []) as {
    title: string;
    description: string | null;
    upvotes_count: number;
  }[];

  if (list.length === 0) {
    return NextResponse.json({ empty: true });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "report",
        posts: list.map((p) => ({
          title: p.title,
          description: p.description ?? "",
          upvotes: p.upvotes_count,
        })),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "The AI service is unavailable right now." },
        { status: 502 }
      );
    }

    const json = (await res.json()) as { markdown?: string; error?: string };
    const markdown = (json.markdown || "").trim();
    if (!markdown) {
      return NextResponse.json(
        { error: json.error || "No report was generated." },
        { status: 502 }
      );
    }

    return NextResponse.json({ markdown, count: list.length });
  } catch {
    return NextResponse.json(
      { error: "The AI service timed out. Try again." },
      { status: 504 }
    );
  }
}
