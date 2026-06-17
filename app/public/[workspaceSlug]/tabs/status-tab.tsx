import { Suspense } from "react";
import { StatusTabContent } from "./status-tab-content";

interface StatusTabProps {
  workspaceId: string;
}

export function StatusTab({ workspaceId }: StatusTabProps) {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading status...</div>}>
      <StatusTabContent workspaceId={workspaceId} />
    </Suspense>
  );
}
