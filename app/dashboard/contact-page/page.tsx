import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Inbox, Mail, MessageSquare } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { toContactConfig, type ContactSubmission } from "@/lib/contact";
import { ContactEditor } from "./contact-editor";
import { PlanBanner } from "@/components/plan-banner";


export const metadata = {
 title: "Contact Page — Pitstop",
};

export default async function ContactPageSettings() {
 const workspace = await getActiveWorkspace();
 if (!workspace) redirect("/onboarding");

 const canManage = workspace.role === "owner" || workspace.role === "admin";

 const supabase = await createClient();

 // Load this workspace's contact configuration.
 const { data: wsRow } = await supabase
  .from("workspaces")
  .select(
   "contact_enabled, contact_title, contact_placeholder, contact_email_required, contact_sms_required"
  )
  .eq("id", workspace.id)
  .single();

 const config = toContactConfig(wsRow ?? {});

 // Submissions inbox (most recent first). RLS scopes these to members.
 const { data: subRows } = await supabase
  .from("contact_submissions")
  .select("id, message, email, sms, created_at")
  .eq("workspace_id", workspace.id)
  .order("created_at", { ascending: false });

 const submissions = (subRows ?? []) as ContactSubmission[];

 // Public origin for the preview link.
 const h = await headers();
 const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
 const proto =
  h.get("x-forwarded-proto") ??
  (host.startsWith("localhost") ? "http" : "https");
 const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
 const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/public/${workspace.slug}/contact`;

 return (
  <div className="mx-auto w-full max-w-3xl px-6 py-10">
   <div className="mb-8">
    <p className="font-mono text-xs text-muted-foreground">
     /contact-page
    </p>
    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
     Contact Page
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
     Configure your public contact form and review incoming messages.
    </p>
   </div>

   <PlanBanner page="contact" />

   {/* Editor (config) */}
   <section className="mb-12">

    <div className="mb-3 flex items-center gap-2">
     <MessageSquare className="size-4 text-muted-foreground" />
     <h2 className="text-sm font-semibold">Configuration</h2>
    </div>
    {canManage ? (
     <ContactEditor
      initial={{
       title: config.title,
       placeholder: config.placeholder,
       emailRequired: config.emailRequired,
       smsRequired: config.smsRequired,
       enabled: config.enabled,
      }}
      publicUrl={publicUrl}
     />
    ) : (
     <p className="rounded-xl  border-2 border-border border-dashed p-6 text-center text-sm text-muted-foreground">
      Only workspace owners and admins can edit the contact page.
     </p>
    )}
   </section>

   {/* Submissions inbox */}
   <section>
    <div className="mb-3 flex items-center gap-2">
     <Inbox className="size-4 text-muted-foreground" />
     <h2 className="text-sm font-semibold">
      Messages
      <span className="ml-2 font-mono text-xs text-muted-foreground">
       {submissions.length}
      </span>
     </h2>
    </div>

    {submissions.length === 0 ? (
     <div className="flex flex-col items-center justify-center rounded-xl  border-2 border-border border-dashed py-16 text-center">
      <Inbox className="mb-3 size-5 text-muted-foreground" />
      <h3 className="text-sm font-medium">No messages yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
       Submissions from your public contact page will appear here.
      </p>
     </div>
    ) : (
     <div className="space-y-3">
      {submissions.map((s) => (
       <div
        key={s.id}
        className="rounded-xl  border-2 border-border bg-card p-5"
       >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 pb-3">
         <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          {s.email ? (
           <span className="inline-flex items-center gap-1.5 text-foreground">
            <Mail className="size-3.5" />
            {s.email}
           </span>
          ) : null}
          {s.sms ? (
           <span className="inline-flex items-center gap-1.5">
            {s.sms}
           </span>
          ) : null}
          {!s.email && !s.sms ? <span>anonymous</span> : null}
         </div>
         <span className="font-mono text-xs text-muted-foreground">
          {new Date(s.created_at).toLocaleString()}
         </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
         {s.message}
        </p>
       </div>
      ))}
     </div>
    )}
   </section>
  </div>
 );
}
