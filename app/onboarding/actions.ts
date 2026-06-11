"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createWorkspace(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();

  if (!name) {
    return { error: "Workspace name is required." };
  }

  const slug = slugify(rawSlug || name);
  if (!slug) {
    return { error: "Please provide a valid slug." };
  }

  // Ensure a profile row exists for this user before we reference it as the
  // workspace owner. Accounts created before the handle_new_user() trigger was
  // installed won't have one, which would otherwise trip the
  // workspaces_owner_id_fkey foreign-key constraint.
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        "New User",
      avatar_url:
        (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return { error: `Could not initialize your profile: ${profileError.message}` };
  }

  // Insert the workspace, owned by the current user.

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (wsError) {
    if (wsError.code === "23505") {
      return { error: "That workspace URL is already taken." };
    }
    return { error: wsError.message };
  }

  // Link the creator as the owner member.
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      profile_id: user.id,
      role: "owner",
    });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
