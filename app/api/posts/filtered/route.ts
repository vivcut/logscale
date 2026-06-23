import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/posts/filtered?workspaceId=...&boardId=...&status=...&flair=...&sort=...&period=...
 *
 * Returns posts across all boards (or a specific board) with rich filtering.
 * Used by the boards filter view on public pages and admin dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const boardId = searchParams.get("boardId");
  const status = searchParams.get("status"); // e.g. "under-review,planned"
  const flair = searchParams.get("flair"); // e.g. "bug,feature"
  const sort = searchParams.get("sort") ?? "votes"; // votes | newest | oldest
  const period = searchParams.get("period"); // 7d | 30d | 90d | all
  const search = searchParams.get("q")?.trim();

  if (!workspaceId && !boardId) {
    return NextResponse.json(
      { error: "workspaceId or boardId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  let query = admin
    .from("posts")
    .select(
      "id, title, description, status, upvotes_count, flair, is_official, author_name, author_avatar_url, created_at, board_id, boards!inner ( id, name, slug, workspace_id )"
    );

  // Scope to workspace or specific board
  if (boardId) {
    query = query.eq("board_id", boardId);
  } else if (workspaceId) {
    query = query.eq("boards.workspace_id", workspaceId);
  }

  // Filter by status(es)
  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in("status", statuses);
    }
  }

  // Filter by flair(s)
  if (flair) {
    const flairs = flair.split(",").map((f) => f.trim()).filter(Boolean);
    if (flairs.length === 1) {
      query = query.eq("flair", flairs[0]);
    } else if (flairs.length > 1) {
      query = query.in("flair", flairs);
    }
  }

  // Filter by time period
  if (period && period !== "all") {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 0;
    if (days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      query = query.gte("created_at", since.toISOString());
    }
  }

  // Search
  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  // Sort
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    // Default: votes (most upvoted first)
    query = query
      .order("upvotes_count", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}
