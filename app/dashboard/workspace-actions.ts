"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace";

/**
 * Persist the user's chosen "active" workspace in a cookie so every server
 * component (dashboard pages, plan banner, watermark, etc.) resolves the same
 * workspace across navigations and refreshes.
 *
 * Verifies membership server-side before trusting the id — a user can only
 * switch to a workspace they actually belong to.
 */
export async function setActiveWorkspace(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("profile_id", user.id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!membership) return { ok: false };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Persist for a year — it's just a UI preference.
    maxAge: 60 * 60 * 24 * 365,
  });

  // Re-render all dashboard surfaces with the newly selected workspace.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
