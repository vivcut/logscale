import { Suspense } from "react";
import { RoadmapTabContent } from "./roadmap-tab-content";

interface RoadmapTabProps {
 workspaceId: string;
 workspaceSlug: string;
}

export function RoadmapTab({ workspaceId, workspaceSlug }: RoadmapTabProps) {
 return (
  <Suspense fallback={<div className="text-center py-8">Loading roadmap...</div>}>
   <RoadmapTabContent workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
  </Suspense>
 );
}
