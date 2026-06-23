import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author_name: string | null;
  author_email: string | null;
  is_official: boolean;
  is_pinned: boolean;
  created_at: string;
};


/**
 * GET /api/comments?postId=...
 * Returns the full comment thread for a post (public). Email addresses are
 * never exposed to the public — only name + official flag are returned.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("comments")
    .select(
      "id, post_id, parent_id, content, author_name, author_avatar_url, author_email, is_official, is_pinned, created_at"
    )
    .eq("post_id", postId)
    // Pinned answers float to the very top, then chronological.
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}


/**
 * POST /api/comments
 * Body: { postId, content, parentId?, fingerprint }
 *
 * Requires the user to be signed in. The comment is attributed to their
 * profile name automatically. Workspace owners/admins get the `is_official`
 * verified badge.
 */
export async function POST(request: NextRequest) {
  let body: {
    postId?: string;
    content?: string;
    parentId?: string | null;
    fingerprint?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postId = body.postId;
  const content = body.content?.trim();
  const parentId = body.parentId || null;
  const fingerprint = body.fingerprint?.trim() || null;

  if (!postId || !content) {
    return NextResponse.json(
      { error: "postId and content are required" },
      { status: 400 }
    );
  }

  // Require authentication.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to comment." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Resolve the post → board → workspace so we can detect official authors.
  const { data: post } = await admin
    .from("posts")
    .select("id, board_id, boards ( id, workspace_id, is_private )")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const board = (
    Array.isArray(post.boards) ? post.boards[0] : post.boards
  ) as { id: string; workspace_id: string; is_private: boolean } | null;

  // Is this user a workspace owner/admin? → official reply with verified badge.
  let isOfficial = false;
  let profileName: string | null = null;

  if (board) {
    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", board.workspace_id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (
      membership &&
      (membership.role === "owner" || membership.role === "admin")
    ) {
      isOfficial = true;
    }
  }

  // Get the user's profile name and avatar for attribution.
  const { data: profile } = await admin
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();
  profileName = profile?.name ?? user.email ?? null;
  const authorAvatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null;

  const { data: inserted, error } = await admin
    .from("comments")
    .insert({
      post_id: postId,
      parent_id: parentId,
      user_id: user.id,
      content,
      author_name: profileName ?? "User",
      author_avatar_url: authorAvatarUrl,
      author_email: user.email ?? null,
      fingerprint_hash: fingerprint,
      is_official: isOfficial,
    })
    .select(
      "id, post_id, parent_id, content, author_name, author_avatar_url, author_email, is_official, is_pinned, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: inserted }, { status: 201 });
}

/**
 * PATCH /api/comments
 * Body: { commentId, pinned }
 *
 * Pins / unpins a comment to the top of its post's thread. Only the workspace
 * owner/admin may do this. Pinning a comment unpins any other pinned comment on
 * the same post so there is always at most one pinned answer.
 */
export async function PATCH(request: NextRequest) {
  let body: { commentId?: string; pinned?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const commentId = body.commentId;
  const pinned = body.pinned ?? true;
  if (!commentId) {
    return NextResponse.json(
      { error: "commentId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve comment → post → board → workspace for authorization.
  const { data: comment } = await admin
    .from("comments")
    .select("id, post_id, posts ( board_id, boards ( workspace_id ) )")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const postRel = (
    Array.isArray(comment.posts) ? comment.posts[0] : comment.posts
  ) as { board_id: string; boards: unknown } | null;
  const boardRel = postRel
    ? ((Array.isArray(postRel.boards)
        ? postRel.boards[0]
        : postRel.boards) as { workspace_id: string } | null)
    : null;

  if (!boardRel) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
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

  // Enforce a single pinned comment per post.
  if (pinned) {
    await admin
      .from("comments")
      .update({ is_pinned: false })
      .eq("post_id", comment.post_id)
      .eq("is_pinned", true);
  }

  const { error } = await admin
    .from("comments")
    .update({ is_pinned: pinned })
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/comments?commentId=...
 *
 * Lets a workspace owner/admin delete any comment on one of their posts —
 * whether it's their own official reply or a visitor's comment. Replies to the
 * deleted comment cascade away via the FK on `comments.parent_id`.
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return NextResponse.json(
      { error: "commentId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve comment → post → board → workspace for authorization.
  const { data: comment } = await admin
    .from("comments")
    .select("id, post_id, posts ( board_id, boards ( workspace_id ) )")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const postRel = (
    Array.isArray(comment.posts) ? comment.posts[0] : comment.posts
  ) as { board_id: string; boards: unknown } | null;
  const boardRel = postRel
    ? ((Array.isArray(postRel.boards)
        ? postRel.boards[0]
        : postRel.boards) as { workspace_id: string } | null)
    : null;

  if (!boardRel) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
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

  const { error } = await admin
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


