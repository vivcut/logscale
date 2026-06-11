"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

export type SettingsActionState = { ok: boolean; error?: string; url?: string };

const LOGO_BUCKET = "workspace-logos";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Uploads a company logo to Supabase Storage and saves the public URL onto the
 * active workspace. Only owners/admins may change the logo.
 *
 * Accepts a FormData with a single `logo` File so we can stream the binary
 * straight through without base64 bloat.
 */
export async function uploadWorkspaceLogo(
  formData: FormData
): Promise<SettingsActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Use a PNG, JPG, WEBP or SVG image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 2MB." };
  }

  const admin = createAdminClient();

  // Make sure the bucket exists (idempotent) so first-run installs work.
  await admin.storage.createBucket(LOGO_BUCKET, { public: true }).catch(() => {});

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${workspace.id}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("workspaces")
    .update({ logo_url: publicUrl })
    .eq("id", workspace.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true, url: publicUrl };
}

/** Removes the workspace logo (clears logo_url). */
export async function removeWorkspaceLogo(): Promise<SettingsActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ logo_url: null })
    .eq("id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Toggles whether the public changelog is visible for the active workspace.
 * Only owners/admins may change it.
 */
export async function setChangelogEnabled(
  enabled: boolean
): Promise<SettingsActionState> {
  return setSurfaceEnabled("changelog", enabled);
}

/** The public surfaces that can be hidden from visitors. */
export type PublicSurface =
  | "boards"
  | "roadmap"
  | "changelog"
  | "surveys"
  | "status"
  | "contact";

const SURFACE_COLUMN: Record<PublicSurface, string> = {
  boards: "boards_enabled",
  roadmap: "roadmap_enabled",
  changelog: "changelog_enabled",
  surveys: "surveys_enabled",
  status: "status_enabled",
  contact: "contact_enabled",
};

// Most surfaces have a matching dashboard route at /dashboard/<surface>; the
// exceptions are revalidated explicitly here.
const SURFACE_REVALIDATE_PATH: Partial<Record<PublicSurface, string>> = {
  contact: "/dashboard/contact-page",
};

/**
 * Toggles whether a given public surface (boards / roadmap / changelog /
 * surveys / status) is visible to visitors. Turning a surface OFF only hides
 * the public page + widget tab — no underlying data is ever deleted. Only
 * owners/admins may change it.
 */
export async function setSurfaceEnabled(
  surface: PublicSurface,
  enabled: boolean
): Promise<SettingsActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const column = SURFACE_COLUMN[surface];
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ [column]: enabled })
    .eq("id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath(SURFACE_REVALIDATE_PATH[surface] ?? `/dashboard/${surface}`);
  return { ok: true };
}


