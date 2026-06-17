import { Suspense } from "react";
import { ChangelogTabContent } from "./changelog-tab-content";

interface ChangelogTabProps {
  workspaceId: string;
}

export function ChangelogTab({ workspaceId }: ChangelogTabProps) {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading changelog...</div>}>
      <ChangelogTabContent workspaceId={workspaceId} />
    </Suspense>
  );
}
