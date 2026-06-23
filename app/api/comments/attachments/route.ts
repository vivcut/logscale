import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Force Node.js runtime so Buffer / large bodies work reliably
export const runtime = "nodejs";

/**
 * POST /api/comments/attachments
 * multipart/form-data: { file, commentId? | postId? }
 *
 * Uploads a single image or PDF. Accepts either:
 * - `commentId` — attaches to an existing comment (author-only)
 * - `postId` — uploads to a post folder for inline embedding in a new comment
 *
 * At least one of commentId or postId must be provided.
 */

const BUCKET = "comment-attachments";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per file
const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  // Require auth
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const commentId = (form.get("commentId") as string | null)?.trim() || null;
  const postId = (form.get("postId") as string | null)?.trim() || null;
  const file = form.get("file");

  if (!commentId && !postId) {
    return NextResponse.json({ error: "commentId or postId is required." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPG, WEBP, GIF or PDF files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Each file must be under 5MB." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // If commentId provided, verify ownership
  if (commentId) {
    const { data: comment, error: commentError } = await admin
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "You can only attach files to your own comments." }, { status: 403 });
    }
  }

  // If postId provided, verify the post exists
  if (postId && !commentId) {
    const { data: post, error: postError } = await admin
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
  }

  // Ensure bucket exists (idempotent — ignores "already exists" error)
  const { error: bucketErr } = await admin.storage.createBucket(BUCKET, { public: true });
  if (bucketErr && !bucketErr.message?.includes("already exists")) {
    console.error("[comment-attachments] bucket creation error:", bucketErr.message);
  }

  const folder = commentId ?? `post-${postId}`;
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const arrayBuf = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuf, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("[comment-attachments] upload error:", uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json(
    { attachment: { url: publicUrl, file_name: file.name, content_type: file.type, size: file.size } },
    { status: 201 }
  );
}
