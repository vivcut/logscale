import { createAdminClient } from "@/lib/supabase/admin";

/** A workspace's contact-page configuration (heading, placeholder, required). */
export type ContactConfig = {
  title: string;
  placeholder: string;
  emailRequired: boolean;
  smsRequired: boolean;
  enabled: boolean;
};

export const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  title: "Contact us",
  placeholder: "How can we help?",
  emailRequired: true,
  smsRequired: false,
  enabled: true,
};

/** A single visitor submission shown in the dashboard inbox. */
export type ContactSubmission = {
  id: string;
  message: string;
  email: string | null;
  sms: string | null;
  created_at: string;
};

type WorkspaceContactRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  contact_enabled: boolean | null;
  contact_title: string | null;
  contact_placeholder: string | null;
  contact_email_required: boolean | null;
  contact_sms_required: boolean | null;
};

/** Normalize raw workspace columns into a ContactConfig (with safe defaults). */
export function toContactConfig(row: {
  contact_enabled?: boolean | null;
  contact_title?: string | null;
  contact_placeholder?: string | null;
  contact_email_required?: boolean | null;
  contact_sms_required?: boolean | null;
}): ContactConfig {
  return {
    title: row.contact_title || DEFAULT_CONTACT_CONFIG.title,
    placeholder: row.contact_placeholder || DEFAULT_CONTACT_CONFIG.placeholder,
    emailRequired: row.contact_email_required ?? DEFAULT_CONTACT_CONFIG.emailRequired,
    smsRequired: row.contact_sms_required ?? DEFAULT_CONTACT_CONFIG.smsRequired,
    enabled: row.contact_enabled ?? DEFAULT_CONTACT_CONFIG.enabled,
  };
}

/**
 * Loads the public contact page for a workspace slug. Returns null when the
 * workspace doesn't exist or the owner has the contact surface turned off (the
 * config + submissions are preserved and reappear when re-enabled).
 */
export async function getPublicContact(workspaceSlug: string): Promise<{
  workspace: { id: string; name: string; slug: string; logo_url: string | null };
  config: ContactConfig;
} | null> {
  const supabase = createAdminClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select(
      "id, name, slug, logo_url, contact_enabled, contact_title, contact_placeholder, contact_email_required, contact_sms_required"
    )
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) return null;

  const ws = workspace as WorkspaceContactRow;
  const config = toContactConfig(ws);
  if (!config.enabled) return null;

  return {
    workspace: {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      logo_url: ws.logo_url,
    },
    config,
  };
}
