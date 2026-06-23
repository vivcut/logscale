"use client";

import { useState, useEffect } from "react";
import { BoardsTab } from "./tabs/boards-tab";
import { ChangelogTab } from "./tabs/changelog-tab";
import { RoadmapTab } from "./tabs/roadmap-tab";

interface Features {
 boards: boolean;
 changelog: boolean;
 roadmap: boolean;
 status: boolean;
 contact: boolean;
}

interface PublicDashboardProps {
 workspaceId: string;
 workspaceSlug: string;
 workspaceName: string;
 features: Features;
 teamName: string | null;
 teamEmail: string | null;
 initialTab?: string;
 changelog_enabled: boolean;
 boards_enabled: boolean;
 roadmap_enabled: boolean;
}

type TabKey = "boards" | "changelog" | "roadmap";

export function PublicDashboard({
 workspaceId,
 changelog_enabled,
 boards_enabled,
 roadmap_enabled,
 workspaceSlug,
 workspaceName,
 features,
 teamName,
 teamEmail,
 initialTab = "boards",
}: PublicDashboardProps) {
 const enabledTabs: TabKey[] = [];
 if (boards_enabled) enabledTabs.push("boards");
 if (roadmap_enabled) enabledTabs.push("roadmap");
 if (changelog_enabled) enabledTabs.push("changelog");

 const defaultTab = enabledTabs.includes(initialTab as TabKey)
  ? (initialTab as TabKey)
  : enabledTabs[0];

 const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

 useEffect(() => {
  if (enabledTabs.length > 0 && !enabledTabs.includes(activeTab)) {
   setActiveTab(enabledTabs[0]);
  }
 }, [boards_enabled, roadmap_enabled, changelog_enabled, activeTab, enabledTabs]);

 if (enabledTabs.length === 0) {
  return (
   <div className="mx-auto w-full max-w-md px-6 py-12 text-center">
    <div className="rounded-md border border-border border-dashed bg-secondary/20 p-8">
     <p className="text-sm font-medium text-foreground">
      This workspace is private
     </p>
     <p className="mt-1 text-xs text-muted-foreground">
      The administrator hasn&apos;t enabled any public sections yet.
     </p>
    </div>
   </div>
  );
 }

 return (
  <div className="w-full">
   {/* Render the active tab content directly — no tab bar needed since nav is in header */}
   {boards_enabled && activeTab === "boards" && (
    <BoardsTab
     workspaceId={workspaceId}
     workspaceSlug={workspaceSlug}
     teamName={teamName}
     teamEmail={teamEmail}
    />
   )}

   {changelog_enabled && activeTab === "changelog" && (
    <ChangelogTab workspaceId={workspaceId} />
   )}

   {roadmap_enabled && activeTab === "roadmap" && (
    <RoadmapTab workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
   )}
  </div>
 );
}
