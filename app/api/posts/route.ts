import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/posts?boardId=...&q=...
 * Returns posts for a board, optionally filtered by a title search query.
 * Used for both the live list and the inline "duplicate detection" search.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") ?? "top";

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("posts")
    .select(
      "id, title, description, status, upvotes_count, flair, is_official, author_name, author_avatar_url, created_at"
    )
    .eq("board_id", boardId);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  query =
    sort === "new"
      ? query.order("created_at", { ascending: false })
      : query
          .order("upvotes_count", { ascending: false })
          .order("created_at", { ascending: false });

  const { data, error } = await query.limit(q ? 5 : 100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

/**
 * POST /api/posts
 * Body: { boardId, title, description, flair, fingerprint }
 * Creates a new feedback post. Requires the user to be signed in.
 * The post is attributed to the user's profile name automatically.
 */
export async function POST(request: NextRequest) {
  let body: {
    boardId?: string;
    title?: string;
    description?: string;
    fingerprint?: string;
    flair?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const boardId = body.boardId;
  const title = body.title?.trim();
  const description = body.description?.trim() || null;
  const fingerprint = body.fingerprint?.trim() || null;
  const flair = body.flair?.trim().toLowerCase() || null;

  if (!boardId || !title) {
    return NextResponse.json(
      { error: "boardId and title are required" },
      { status: 400 }
    );
  }

  // A flair is mandatory on every submission.
  if (!flair) {
    return NextResponse.json(
      { error: "Please choose a flair for your post." },
      { status: 400 }
    );
  }

  // Require authentication — users must be signed in to post.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to submit feedback." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Validate the board exists.
  const { data: board, error: boardError } = await admin
    .from("boards")
    .select("id, is_private, workspace_id")
    .eq("id", boardId)
    .single();

  if (boardError || !board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (board.is_private) {
    return NextResponse.json(
      { error: "This board is private." },
      { status: 403 }
    );
  }

  // Determine if the user is a workspace member (team post → verified badge).
  let isOfficial = false;
  let authorName: string | null = null;

  const { data: membership } = await admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", board.workspace_id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (membership) {
    isOfficial = true;
  }

  // Get the user's profile name and avatar for attribution.
  const { data: profile } = await admin
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  authorName = profile?.name ?? user.email ?? null;
  const authorAvatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;

  const { data: inserted, error } = await admin
    .from("posts")
    .insert({
      board_id: boardId,
      user_id: user.id,
      fingerprint_hash: fingerprint,
      title,
      description,
      flair,
      is_official: isOfficial,
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
      author_email: user.email ?? null,
    })
    .select(
      "id, title, description, status, upvotes_count, flair, is_official, author_name, author_avatar_url, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seed the activity timeline with the initial "under-review" entry.
  if (inserted?.id) {
    await admin.from("post_status_events").insert({
      post_id: inserted.id,
      status: "under-review",
    });
  }

  return NextResponse.json({ post: inserted }, { status: 201 });
}

/**
 * DELETE /api/posts?postId=...
 *
 * Lets a workspace owner/admin delete any post on one of their boards.
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json(
      { error: "postId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve post → board → workspace for authorization.
  const { data: post } = await admin
    .from("posts")
    .select("id, board_id, boards ( workspace_id )")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const boardRel = (
    Array.isArray(post.boards) ? post.boards[0] : post.boards
  ) as { workspace_id: string } | null;

  if (!boardRel) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Must be an authenticated owner/admin of the workspace.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", boardRel.workspace_id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete associated comments first, then the post.
  await admin.from("comments").delete().eq("post_id", postId);
  await admin.from("post_status_events").delete().eq("post_id", postId);

  const { error } = await admin
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
