import { createClient } from "@/lib/supabase/server";

export type ActiveWorkspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  changelog_enabled: boolean;
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

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role, workspaces ( id, name, slug, logo_url, changelog_enabled )")
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
    changelog_enabled: boolean | null;
  };

  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    logo_url: ws.logo_url,
    changelog_enabled: ws.changelog_enabled ?? true,
    role: membership.role as string,
  };
}

