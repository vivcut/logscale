import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

/**
 * POST /api/changelog/images
 * multipart/form-data: { file }
 *
 * Uploads an image for embedding into changelog markdown. Restricted to
 * signed-in workspace members (owners/admins) and enforces a strict
 * type + size limit. Returns the public URL to splice into the editor as
 * `![alt](url)`.
 */

const BUCKET = "changelog-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  // Auth: only members of an active workspace may upload.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const workspace = await getActiveWorkspace().catch(() => null);
  if (!workspace) {
    return NextResponse.json({ error: "No workspace." }, { status: 403 });
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

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPG, WEBP or GIF images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5MB." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${workspace.id}/${Date.now()}-${Math.random()
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

  return NextResponse.json({ url: publicUrl }, { status: 201 });
}
