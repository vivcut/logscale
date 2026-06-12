import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

/**
 * Cookie that stores the user's currently selected workspace id. Written by the
 * workspace switcher (setActiveWorkspace server action) and read here so the
 * choice survives navigations and refreshes.
 */
export const ACTIVE_WORKSPACE_COOKIE = "ttm_active_workspace";

export type ActiveWorkspace = {

  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  changelog_enabled: boolean;
  boards_enabled: boolean;
  roadmap_enabled: boolean;
  surveys_enabled: boolean;
  status_enabled: boolean;
  contact_enabled: boolean;
  widget_theme: "auto" | "dark" | "light";
  role: string;
};




/**
 * Resolves the current user's "active" workspace.
 * For now this is the first workspace the user is a member of.
 * Returns null if unauthenticated or not a member of any workspace.
 */
export async function getActiveWorkspace(): Promise<ActiveWorkspace | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // The user's preferred workspace (set by the switcher) is stored in a cookie.
  const cookieStore = await cookies();
  const preferredId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;

  // Select the whole workspace row (rather than naming optional columns) so a
  // not-yet-applied migration (e.g. widget_theme, *_enabled) can't make the
  // entire join fail and surface as "No active workspace" everywhere.
  //
  // Fetch ALL memberships (oldest first) so we can honor the cookie selection
  // and fall back to the first workspace when no/invalid cookie is present.
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role, workspaces ( * )")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true });

  const rows = (memberships ?? []).filter((m) => m.workspaces);
  if (rows.length === 0) return null;

  const membership =
    (preferredId
      ? rows.find(
          (m) =>
            (m.workspaces as unknown as { id: string }).id === preferredId
        )
      : null) ?? rows[0];

  if (!membership || !membership.workspaces) return null;


  const ws = membership.workspaces as unknown as {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    changelog_enabled?: boolean | null;
    boards_enabled?: boolean | null;
    roadmap_enabled?: boolean | null;
    surveys_enabled?: boolean | null;
    status_enabled?: boolean | null;
    contact_enabled?: boolean | null;
    widget_theme?: "auto" | "dark" | "light" | null;
  };


  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    logo_url: ws.logo_url,
    changelog_enabled: ws.changelog_enabled ?? true,
    boards_enabled: ws.boards_enabled ?? true,
    roadmap_enabled: ws.roadmap_enabled ?? true,
    surveys_enabled: ws.surveys_enabled ?? true,
    status_enabled: ws.status_enabled ?? true,
    contact_enabled: ws.contact_enabled ?? true,
    widget_theme: ws.widget_theme ?? "auto",
    role: membership.role as string,
  };


}

