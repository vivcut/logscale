"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProfileActionState = { ok: boolean; error?: string; url?: string };

/** Updates the signed-in user's display name on their profile. */
export async function updateProfileName(
  name: string
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name is required." };
  if (trimmed.length > 80) return { ok: false, error: "Name is too long." };

  const { error } = await supabase
    .from("profiles")
    .update({ name: trimmed })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

const AVATAR_BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Uploads a new avatar to Supabase Storage and saves the public URL onto the
 * signed-in user's profile.
 */
export async function uploadAvatar(
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Use a PNG, JPG or WEBP image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 2MB." };
  }

  const admin = createAdminClient();

  // Make sure the bucket exists (idempotent) so first-run installs work.
  await admin.storage
    .createBucket(AVATAR_BUCKET, { public: true })
    .catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, url: publicUrl };
}

/** Removes the user's avatar (clears avatar_url). */
export async function removeAvatar(): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
