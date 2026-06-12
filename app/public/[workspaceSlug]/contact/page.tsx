import { notFound } from "next/navigation";

import { getPublicContact } from "@/lib/contact";
import { ContactForm } from "@/components/contact-form";
import { Watermark } from "@/components/watermark";


type PageParams = { workspaceSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  const data = await getPublicContact(workspaceSlug);
  return {
    title: data ? `${data.config.title} — ${data.workspace.name}` : "Contact",
  };
}

export default async function PublicContactPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;

  // Returns null when the workspace is missing or the contact surface is off
  // (the config + submissions are preserved and reappear when re-enabled).
  const data = await getPublicContact(workspaceSlug);
  if (!data) notFound();

  const { workspace, config } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        {/* Workspace identity header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary text-sm font-medium">
            {workspace.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="size-full object-cover"
              />
            ) : (
              workspace.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {workspace.name}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              {config.title}
            </h1>
          </div>
        </div>

        <ContactForm
          workspaceId={workspace.id}
          placeholder={config.placeholder}
          emailRequired={config.emailRequired}
          smsRequired={config.smsRequired}
        />

        <Watermark workspaceId={workspace.id} />
      </div>

    </div>
  );
}
