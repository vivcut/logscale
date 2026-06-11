"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspace } from "@/lib/workspace";

export type ContactActionState = { ok: boolean; error?: string };

/**
 * Save the active workspace's contact-page configuration: heading text,
 * textarea placeholder, whether email / SMS are mandatory, and the
 * enabled toggle. Only owners/admins may edit it.
 */
export async function saveContactConfig(
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No active workspace." };
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    return { ok: false, error: "You don't have permission to edit this." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Please enter a title." };

  const placeholder =
    String(formData.get("placeholder") ?? "").trim() || "How can we help?";
  const emailRequired = formData.get("email_required") === "true";
  const smsRequired = formData.get("sms_required") === "true";
  const enabled = formData.get("enabled") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({
      contact_title: title,
      contact_placeholder: placeholder,
      contact_email_required: emailRequired,
      contact_sms_required: smsRequired,
      contact_enabled: enabled,
    })
    .eq("id", workspace.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/contact-page");
  return { ok: true };
}

export type ContactSubmitState = { ok: boolean; error?: string };

/**
 * Public contact submission. Validates the message and the workspace's
 * email/SMS requirements, then inserts a row via the service-role admin client
 * (so anonymous visitors can submit without a broad INSERT policy).
 */
export async function submitContact(
  _prev: ContactSubmitState,
  formData: FormData
): Promise<ContactSubmitState> {
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!workspaceId) return { ok: false, error: "Missing workspace." };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { ok: false, error: "Please enter a message." };

  const email = String(formData.get("email") ?? "").trim();
  const sms = String(formData.get("sms") ?? "").trim();

  const admin = createAdminClient();

  // Re-read the workspace config server-side so requirements can't be bypassed
  // by tampering with the client, and to confirm the surface is enabled.
  const { data: workspace } = await admin
    .from("workspaces")
    .select(
      "id, contact_enabled, contact_email_required, contact_sms_required"
    )
    .eq("id", workspaceId)
    .single();

  if (!workspace || workspace.contact_enabled === false) {
    return { ok: false, error: "This contact form is not accepting messages." };
  }

  if (workspace.contact_email_required && !email) {
    return { ok: false, error: "Email is required." };
  }
  if (workspace.contact_sms_required && !sms) {
    return { ok: false, error: "Phone number is required." };
  }

  const { error } = await admin.from("contact_submissions").insert({
    workspace_id: workspaceId,
    message,
    email: email || null,
    sms: sms || null,
  });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
