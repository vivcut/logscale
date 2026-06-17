import { Suspense } from "react";
import { ContactTabContent } from "./contact-tab-content";

interface ContactTabProps {
  workspaceSlug: string;
}

export function ContactTab({ workspaceSlug }: ContactTabProps) {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading contact...</div>}>
      <ContactTabContent workspaceSlug={workspaceSlug} />
    </Suspense>
  );
}
