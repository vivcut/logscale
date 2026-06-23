import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";


/**
 * POST /api/posts/attachments
 * multipart/form-data: { postId, file }
 *
 * Uploads a single image or PDF and attaches it to an existing post. Enforces
 * strict limits (type + size + count) so anonymous visitors can't abuse it.
 * Files land in the public-read `post-attachments` bucket and a metadata row
 * is recorded in `post_attachments`.
 */

const BUCKET = "post-attachments";

// Strict limits.
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per file
const MAX_PER_POST = 4; // at most 4 attachments per post
const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const postId = (form.get("postId") as string | null)?.trim();
  const file = form.get("file");

  if (!postId) {
    return NextResponse.json({ error: "postId is required." }, { status: 400 });
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

  // The post must exist before we attach to it.
  const { data: post, error: postError } = await admin
    .from("posts")
    .select("id, boards ( workspace_id )")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }



  // Enforce the per-post attachment cap.
  const { count } = await admin
    .from("post_attachments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  if ((count ?? 0) >= MAX_PER_POST) {
    return NextResponse.json(
      { error: `A post can have at most ${MAX_PER_POST} attachments.` },
      { status: 400 }
    );
  }

  // Make sure the bucket exists (idempotent) so first-run installs work.
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${postId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { data: attachment, error: insertError } = await admin
    .from("post_attachments")
    .insert({
      post_id: postId,
      url: publicUrl,
      path,
      file_name: file.name,
      content_type: file.type,
      size: file.size,
    })
    .select("id, url, file_name, content_type, size, created_at")
    .single();

  if (insertError) {
    // Best-effort cleanup of the orphaned object.
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ attachment }, { status: 201 });
}
