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
    .select("id, title, description, status, upvotes_count, flair, created_at")
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
 * Body: { boardId, title, description, fingerprint }
 * Creates a new feedback post. Associates the logged-in user when present,
 * otherwise stores the device fingerprint for anonymous attribution.
 */
export async function POST(request: NextRequest) {
  let body: {
    boardId?: string;
    title?: string;
    description?: string;
    fingerprint?: string;
    authorName?: string;
    authorEmail?: string;
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
  const authorName = body.authorName?.trim() || null;
  const authorEmail = body.authorEmail?.trim() || null;
  const flair = body.flair?.trim().toLowerCase() || null;


  // Light email validation when provided.
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid email." },
      { status: 400 }
    );
  }


  if (!boardId || !title) {
    return NextResponse.json(
      { error: "boardId and title are required" },
      { status: 400 }
    );
  }

  // A flair is mandatory on every public submission.
  if (!flair) {
    return NextResponse.json(
      { error: "Please choose a flair for your post." },
      { status: 400 }
    );
  }


  // Identify the visitor (if logged in).
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const admin = createAdminClient();

  // Validate the board exists and isn't private (anonymous can't post to private).
  const { data: board, error: boardError } = await admin
    .from("boards")
    .select("id, is_private")
    .eq("id", boardId)
    .single();

  if (boardError || !board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (board.is_private && !user) {
    return NextResponse.json(
      { error: "This board is private." },
      { status: 403 }
    );
  }

  if (!user && !fingerprint) {
    return NextResponse.json(
      { error: "Missing visitor identity." },
      { status: 400 }
    );
  }

  const { data: inserted, error } = await admin
    .from("posts")
    .insert({
      board_id: boardId,
      user_id: user?.id ?? null,
      fingerprint_hash: user ? null : fingerprint,
      title,
      description,
      flair,
      // Only persist contact identity for anonymous submitters.
      author_name: user ? null : authorName,
      author_email: user ? null : authorEmail,
    })
    .select("id, title, description, status, upvotes_count, flair, created_at")
    .single();



  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seed the activity timeline with the initial "under-review" entry so the
  // public post page shows a "Created" event the moment a post is submitted.
  if (inserted?.id) {
    await admin.from("post_status_events").insert({
      post_id: inserted.id,
      status: "under-review",
    });
  }

  return NextResponse.json({ post: inserted }, { status: 201 });
}

