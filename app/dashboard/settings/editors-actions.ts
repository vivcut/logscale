"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

export type EditorActionState = { ok: boolean; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invites a collaborator to the active workspace by email. If a profile with
 * that email already exists they're added as a member immediately; otherwise a
 * pending invite is stored and claimed the next time they sign in.
 * Owners/admins only.
 */
export async function inviteEditor(
  email: string
): Promise<EditorActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const admin = createAdminClient();

  // Already a registered user? Add them directly as a member.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("workspace_members").upsert(
      {
        workspace_id: workspace.id,
        profile_id: existing.id,
        role: "admin",
      },
      { onConflict: "workspace_id,profile_id" }
    );
    if (error) return { ok: false, error: error.message };
  } else {
    // Otherwise store a pending invite to be claimed on first sign-in.
    const { error } = await admin.from("workspace_invites").upsert(
      {
        workspace_id: workspace.id,
        email: normalized,
        role: "admin",
      },
      { onConflict: "workspace_id,email" }
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

/** Revokes a pending invite. Owners/admins only. */
export async function revokeInvite(
  inviteId: string
): Promise<EditorActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId)
    .eq("workspace_id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

/** Removes a member (not the owner) from the active workspace. */
export async function removeMember(
  profileId: string
): Promise<EditorActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "Insufficient permissions." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("profile_id", profileId)
    .neq("role", "owner");

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { ok: true };
}
