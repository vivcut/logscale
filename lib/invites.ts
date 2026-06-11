import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Claims any pending workspace invites for the given email and turns them into
 * workspace_members rows. Called on dashboard load so a user who was invited
 * before signing up automatically gains access on their first visit.
 *
 * Uses the service role since the invitee isn't yet a member (so RLS would
 * otherwise hide the invite from them).
 */
export async function claimPendingInvites(userId: string, email: string) {
  if (!email) return;
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data: invites } = await admin
    .from("workspace_invites")
    .select("id, workspace_id, role")
    .ilike("email", normalized);

  if (!invites || invites.length === 0) return;

  for (const inv of invites) {
    await admin.from("workspace_members").upsert(
      {
        workspace_id: inv.workspace_id,
        profile_id: userId,
        role: inv.role ?? "admin",
      },
      { onConflict: "workspace_id,profile_id" }
    );
  }

  // Remove the claimed invites.
  await admin
    .from("workspace_invites")
    .delete()
    .in(
      "id",
      invites.map((i) => i.id)
    );
}
