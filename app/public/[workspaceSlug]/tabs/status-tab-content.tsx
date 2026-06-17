"use client";

import { useEffect, useState } from "react";
import { getWorkspaceStatus } from "@/lib/uptime";
import { StatusBoard, type StatusSite } from "@/components/status-board";

interface StatusTabContentProps {
  workspaceId: string;
}

export function StatusTabContent({ workspaceId }: StatusTabContentProps) {
  const [statusSites, setStatusSites] = useState<StatusSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [anyDown, setAnyDown] = useState(false);
  const [allUp, setAllUp] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const { sites, eventsBySite, incidentsBySite } = await getWorkspaceStatus(
        workspaceId
      );
      const sites_: StatusSite[] = sites.map((s) => ({
        ...s,
        events: eventsBySite[s.id] ?? [],
        incidents: incidentsBySite[s.id] ?? [],
      }));

      setStatusSites(sites_);
      setAnyDown(sites_.some((s) => s.status === "DOWN"));
      setAllUp(sites_.length > 0 && sites_.every((s) => s.status === "UP"));
      setLoading(false);
    }

    loadStatus();
  }, [workspaceId]);

  if (loading) {
    return <div className="text-center py-8">Loading status...</div>;
  }

  if (statusSites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No monitored sites</p>
      </div>
    );
  }

  return (
    <div>
      {/* Overall status banner */}
      <div
        className={`mb-6 flex items-center gap-3 rounded-xl  border-2 border-border px-4 py-3.5 ${
          anyDown
            ? "border-red-500/30 bg-red-500/10"
            : allUp
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/10"
        }`}
      >
        <span
          className={`size-2.5 rounded-full ${
            anyDown
              ? "bg-red-500"
              : allUp
                ? "bg-emerald-500"
                : "bg-amber-500"
          }`}
        />
        <p className="text-sm font-medium">
          {anyDown
            ? "Some systems are experiencing issues"
            : allUp
              ? "All systems operational"
              : "Status checks pending"}
        </p>
      </div>

      <StatusBoard sites={statusSites} />

      <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
        Automatically monitored every 2 minutes.
      </p>
    </div>
  );
}
