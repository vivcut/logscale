"use client";

import { useState, useEffect } from "react";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  // Build array of active keys dynamically based on enabled flags
  const enabledTabs: TabKey[] = [];
  if (boards_enabled) enabledTabs.push("boards");
  if (roadmap_enabled) enabledTabs.push("roadmap");
  if (changelog_enabled) enabledTabs.push("changelog");

  // Determine the best initial fallback active tab if default isn't available
  const defaultTab = enabledTabs.includes(initialTab as TabKey)
    ? (initialTab as TabKey)
    : enabledTabs[0];

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  // Keep active tab state accurate if flags dynamically change on the client
  useEffect(() => {
    if (enabledTabs.length > 0 && !enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0]);
    }
  }, [boards_enabled, roadmap_enabled, changelog_enabled, activeTab, enabledTabs]);

  const tabLabels: Record<TabKey, string> = {
    boards: "Boards",
    changelog: "Changelog",
    roadmap: "Roadmap",
  };

  // Condition 1: If absolutely nothing is enabled, display private notice
  if (enabledTabs.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-12 text-center">
        <div className="rounded-xl border-2 border-dashed border-border-2 bg-secondary/20 p-8">
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
      {/* Condition 2 & 3: Only show the tab switcher if MORE than 1 tab is enabled */}
      {enabledTabs.length > 1 ? (
        <TabsList
          className="mb-6 bg-card grid w-[50%] not-sm:w-[100%] gap-2"
          style={{
            gridTemplateColumns: `repeat(${enabledTabs.length}, minmax(0, 1fr))`,
          }}
        >
          {enabledTabs.map((tab) => (
            <TabsTrigger
              key={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className="bg-popover!"
            >
              <span className="font-semibold">{tabLabels[tab]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}

      {/* Render Content Blocks dynamically based on flag visibility and current active fallback */}
      {boards_enabled && (
        <TabsContent value="boards" isActive={activeTab === "boards"}>
          <BoardsTab
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            teamName={teamName}
            teamEmail={teamEmail}
          />
        </TabsContent>
      )}

      {changelog_enabled && (
        <TabsContent value="changelog" isActive={activeTab === "changelog"}>
          <ChangelogTab workspaceId={workspaceId} />
        </TabsContent>
      )}

      {roadmap_enabled && (
        <TabsContent value="roadmap" isActive={activeTab === "roadmap"}>
          <RoadmapTab workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
        </TabsContent>
      )}
    </div>
  );
}