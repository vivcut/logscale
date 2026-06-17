import { Suspense } from "react";
import { BoardsTabContent } from "./boards-tab-content";

interface BoardsTabProps {
  workspaceId: string;
  workspaceSlug: string;
  teamName: string | null;
  teamEmail: string | null;
}

export function BoardsTab({
  workspaceId,
  workspaceSlug,
  teamName,
  teamEmail,
}: BoardsTabProps) {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading boards...</div>}>
      <BoardsTabContent
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        teamName={teamName}
        teamEmail={teamEmail}
      />
    </Suspense>
  );
}
