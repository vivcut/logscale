"use client";

import { useEffect, useState } from "react";
import { getPublicContact } from "@/lib/contact";
import { ContactForm } from "@/components/contact-form";

interface ContactTabContentProps {
  workspaceSlug: string;
}

interface ContactData {
  workspace: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  config: {
    title: string;
    description?: string;
    placeholder?: string;
    emailRequired?: boolean;
    smsRequired?: boolean;
  };
}

export function ContactTabContent({ workspaceSlug }: any) {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadContact() {
      const data = await getPublicContact(workspaceSlug);
      if (data) {
        setContactData(data);
      } else {
        setError(true);
      }
      setLoading(false);
    }

    loadContact();
  }, [workspaceSlug]);

  if (loading) {
    return <div className="text-center py-8">Loading contact form...</div>;
  }

  if (error || !contactData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contact form not available</p>
      </div>
    );
  }

  const { workspace, config } = contactData;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Workspace identity header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl  border-2 border-border  bg-secondary text-sm font-medium">
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
          <h2 className="text-lg font-semibold">{config.title}</h2>
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
      </div>

      {/* Contact form */}
      <ContactForm
        workspaceId={workspace.id}
        placeholder={config.placeholder}
        emailRequired={config.emailRequired}
        smsRequired={config.smsRequired}
      />
    </div>
  );
}
