import { redirect } from "next/navigation";

import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceStatus } from "@/lib/uptime";
import { Activity } from "@/components/icons";
import { type StatusSite } from "@/components/status-board";
import { AddSiteForm } from "./add-site-form";
import { ManageableStatusBoard } from "./manageable-status-board";
import { RefreshButton } from "./refresh-button";
import { PlanBanner } from "@/components/plan-banner";
import { ShareLink } from "@/components/share-link";




export const metadata = { title: "Status — Uptime monitoring" };

// Always render fresh so the latest checker results show on every visit.
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const canManage = workspace.role === "owner" || workspace.role === "admin";

  const { sites, eventsBySite, incidentsBySite } = await getWorkspaceStatus(
    workspace.id
  );
  const statusSites: StatusSite[] = sites.map((s) => ({
    ...s,
    events: eventsBySite[s.id] ?? [],
    incidents: incidentsBySite[s.id] ?? [],
  }));


  const upCount = statusSites.filter((s) => s.status === "UP").length;
  const downCount = statusSites.filter((s) => s.status === "DOWN").length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl  border-2 border-border  bg-card">
            <Activity className="size-4" />
          </div>
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              uptime / monitor
            </p>
            <h1 className="text-lg font-semibold tracking-tight">Status</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {statusSites.length > 0 ? (
            <div className="hidden items-center gap-4 font-mono text-xs text-muted-foreground tabular-nums sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                {upCount} up
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-red-500" />
                {downCount} down
              </span>
            </div>
          ) : null}
          <RefreshButton />
        </div>
      </div>

      {/* Public page link */}
      <div className="mb-6">
        <p className="mb-1.5 font-mono text-xs text-muted-foreground">
          public status page link
        </p>
        <ShareLink
          url={`/public/${workspace.slug}/status`}
          label={`${workspace.name} status`}
        />
      </div>

      <PlanBanner page="status" />


      {canManage ? (

        <div className="mb-6">
          <AddSiteForm />
        </div>
      ) : null}

      <ManageableStatusBoard sites={statusSites} canManage={canManage} />


      <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
        Checks run automatically every 2 minutes via a batched Supabase Edge
        Function. Only status <em>changes</em> are logged, so the history bars
        stay compact — hover any bar for the exact time and URL.
      </p>
    </div>
  );
}
