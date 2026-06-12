import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceStatus } from "@/lib/uptime";
import { StatusBoard, type StatusSite } from "@/components/status-board";
import { Watermark } from "@/components/watermark";


type PageParams = { workspaceSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  return { title: `${workspaceSlug} — Status` };
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  const supabase = createAdminClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, logo_url, status_enabled")
    .eq("slug", workspaceSlug)
    .single();

  // Status page hidden from public view (toggle off) → 404. Data is preserved.
  if (!workspace || workspace.status_enabled === false) notFound();


  const { sites, eventsBySite, incidentsBySite } = await getWorkspaceStatus(
    workspace.id
  );
  const statusSites: StatusSite[] = sites.map((s) => ({
    ...s,
    events: eventsBySite[s.id] ?? [],
    incidents: incidentsBySite[s.id] ?? [],
  }));


  // Overall banner state: all-up vs degraded.
  const anyDown = statusSites.some((s) => s.status === "DOWN");
  const allUp =
    statusSites.length > 0 && statusSites.every((s) => s.status === "UP");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-sm font-bold text-primary-foreground">
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
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {workspace.name} / status
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              System Status
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Overall status banner */}
        {statusSites.length > 0 ? (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3.5 ${
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
        ) : null}

        <StatusBoard sites={statusSites} />

        <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
          Automatically monitored every 2 minutes.
        </p>
        <Watermark workspaceId={workspace.id} />
      </main>

    </div>
  );
}
