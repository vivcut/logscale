"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";
import {
  getWorkspaceSubscription,
  hasStartupPlan,
  PLAN_LIMITS,
} from "@/lib/subscription";


export type StatusActionState = {
  ok: boolean;
  error?: string;
};

/**
 * Normalize user-entered URLs — prepend https:// when no scheme is present so
 * the background checker's fetch() always receives a valid absolute URL.
 */
function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function addMonitoredSite(
  _prev: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to add a site." };
  }

  // Only owners/admins of the active workspace may add monitored sites.
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace found." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to add sites." };
  }

  const url = normalizeUrl(String(formData.get("url") ?? ""));
  if (!url) {
    return { ok: false, error: "Please enter a valid website URL." };
  }
  const title = String(formData.get("title") ?? "").trim() || null;

  // Hobby plan limits: at most PLAN_LIMITS.maxStatusSites links, and only base
  // origin URLs (no specific paths / directories / query strings).
  const subscription = await getWorkspaceSubscription(workspace.id);
  if (!hasStartupPlan(subscription)) {
    const parsed = new URL(url);
    const isBaseUrl =
      (parsed.pathname === "/" || parsed.pathname === "") &&
      !parsed.search &&
      !parsed.hash;
    if (!isBaseUrl) {
      return {
        ok: false,
        error:
          "The Hobby plan only allows base URLs (e.g. https://example.com) with no paths or directories. Upgrade to the Startup plan to monitor specific pages.",
      };
    }

    const { count } = await supabase
      .from("monitored_sites")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);
    if ((count ?? 0) >= PLAN_LIMITS.maxStatusSites) {
      return {
        ok: false,
        error: `The Hobby plan is limited to ${PLAN_LIMITS.maxStatusSites} monitored links. Upgrade to the Startup plan for unlimited links.`,
      };
    }
  }


  // New sites start as 'PENDING' so the UI shows "Checked soon" — never a
  // misleading "Up" — until the first real probe runs.
  const { error } = await supabase.from("monitored_sites").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    title,
    url,
    status: "PENDING",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/status");
  return { ok: true };
}

export async function updateSiteTitle(
  _prev: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const supabase = await createClient();

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace found." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to edit sites." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing site id." };
  const title = String(formData.get("title") ?? "").trim() || null;

  const { error } = await supabase
    .from("monitored_sites")
    .update({ title })
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/status");
  return { ok: true };
}

export async function deleteMonitoredSite(
  _prev: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const supabase = await createClient();

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace found." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to remove sites." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing site id." };

  const { error } = await supabase
    .from("monitored_sites")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/status");
  return { ok: true };
}

const INCIDENT_TAGS = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
] as const;

/**
 * Post a manual incident update for a monitored site (Investigating →
 * Identified → Monitoring → Resolved). The site must belong to the active
 * workspace and the caller must be an owner/admin.
 */
export async function addIncidentUpdate(
  _prev: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const supabase = await createClient();

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace found." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to post updates." };
  }

  const siteId = String(formData.get("site_id") ?? "");
  if (!siteId) return { ok: false, error: "Missing site id." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Please enter a title." };

  const body = String(formData.get("body") ?? "").trim() || null;
  const tagRaw = String(formData.get("tag") ?? "investigating");
  const tag = (INCIDENT_TAGS as readonly string[]).includes(tagRaw)
    ? tagRaw
    : "investigating";

  // Confirm the site belongs to the active workspace before writing.
  const admin = createAdminClient();
  const { data: site } = await admin
    .from("monitored_sites")
    .select("id, workspace_id")
    .eq("id", siteId)
    .single();

  if (!site || site.workspace_id !== workspace.id) {
    return { ok: false, error: "Site not found in this workspace." };
  }

  const { error } = await admin.from("site_incidents").insert({
    site_id: siteId,
    title,
    body,
    tag,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/status");
  return { ok: true };
}

/**
 * Delete a manual incident update. Owner/admin of the owning workspace only.
 */
export async function deleteIncidentUpdate(
  _prev: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace found." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to delete updates." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing update id." };

  const admin = createAdminClient();

  // Verify the incident's site belongs to the active workspace.
  const { data: incident } = await admin
    .from("site_incidents")
    .select("id, monitored_sites ( workspace_id )")
    .eq("id", id)
    .single();

  const wsId = (
    incident?.monitored_sites as unknown as { workspace_id: string } | null
  )?.workspace_id;
  if (!incident || wsId !== workspace.id) {
    return { ok: false, error: "Update not found in this workspace." };
  }

  const { error } = await admin.from("site_incidents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/status");
  return { ok: true };
}

/**
 * Manual "refresh now" — probes every site in the active workspace immediately

 * (instead of waiting for the 2-minute cron). Mirrors the Edge Function logic:
 * HEAD with GET fallback, and only logs a status CHANGE event. Uses the admin
 * client so it can write status/events regardless of RLS.
 */
export async function refreshNow(): Promise<StatusActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace found." };

  const admin = createAdminClient();

  const { data: sites } = await admin
    .from("monitored_sites")
    .select("id, url, status")
    .eq("workspace_id", workspace.id);

  if (!sites || sites.length === 0) {
    revalidatePath("/dashboard/status");
    return { ok: true };
  }

  await Promise.all(
    sites.map(async (site) => {
      let isUp = false;
      try {
        const res = await fetch(site.url, {
          method: "HEAD",
          signal: AbortSignal.timeout(10000),
        });
        if (res.status === 405) {
          const fb = await fetch(site.url, {
            method: "GET",
            signal: AbortSignal.timeout(10000),
          });
          isUp = fb.ok;
        } else {
          isUp = res.ok;
        }
      } catch {
        isUp = false;
      }

      const newStatus = isUp ? "UP" : "DOWN";

      await admin
        .from("monitored_sites")
        .update({
          status: newStatus,
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", site.id);

      if (newStatus !== site.status) {
        await admin
          .from("site_status_events")
          .insert({ site_id: site.id, status: newStatus });
      }
    })
  );

  revalidatePath("/dashboard/status");
  return { ok: true };
}
