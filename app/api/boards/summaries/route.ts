import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { summarizePost } from "@/app/dashboard/implement-data";

/**
 * Lazily generates one-line AI gists for the "what to build next" posts.
 *
 * Called from the client AFTER the boards page has rendered, so the (slow) AI
 * worker never blocks the initial load. Accepts a list of post ids, verifies
 * they belong to the active workspace, summarizes them in parallel, and returns
 * { summaries: { [postId]: string } }. Falls back to a trimmed description per
 * post when the worker is unavailable.
 */
export async function POST(request: Request) {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return NextResponse.json({ error: "No active workspace." }, { status: 401 });
  }

  let ids: string[] = [];
  try {
    const body = (await request.json()) as { ids?: unknown };
    if (Array.isArray(body.ids)) {
      ids = body.ids.filter((x): x is string => typeof x === "string").slice(0, 30);
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (ids.length === 0) {
    return NextResponse.json({ summaries: {} });
  }

  const supabase = await createClient();

  // Tenant scoping: only summarize posts that live on this workspace's boards.
  const { data: boards } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspace.id);
  const boardIds = (boards ?? []).map((b) => b.id as string);
  if (boardIds.length === 0) {
    return NextResponse.json({ summaries: {} });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, description, board_id")
    .in("id", ids)
    .in("board_id", boardIds);

  const list = (posts ?? []) as {
    id: string;
    title: string;
    description: string | null;
  }[];

  const summaries: Record<string, string> = {};
  await Promise.all(
    list.map(async (p) => {
      const summary = await summarizePost({
        title: p.title,
        description: p.description,
      });
      if (summary) summaries[p.id] = summary;
    })
  );

  return NextResponse.json({ summaries });
}
