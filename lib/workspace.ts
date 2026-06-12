import { createClient } from "@/lib/supabase/server";

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

  // Select the whole workspace row (rather than naming optional columns) so a
  // not-yet-applied migration (e.g. widget_theme, *_enabled) can't make the
  // entire join fail and surface as "No active workspace" everywhere.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role, workspaces ( * )")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

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

