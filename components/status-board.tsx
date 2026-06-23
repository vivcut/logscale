"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
 buildHistory,
 buildTimeline,
 uptimePercent,
 humanizeDuration,
 type MonitoredSite,
 type StatusEvent,
 type Incident,
 type SiteStatus,
 type IncidentTag,
 type TimelineEntry,
} from "@/lib/uptime";

export type StatusSite = MonitoredSite & {
 events: StatusEvent[];
 incidents: Incident[];
};

function timeAgo(iso: string): string {
 const diff = Date.now() - new Date(iso).getTime();
 return `${humanizeDuration(diff)} ago`.replace("just now ago", "just now");
}

function formatFull(iso: string): string {
 return new Date(iso).toLocaleString(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });
}

const STATUS_META: Record<
 SiteStatus,
 { label: string; dot: string; pill: string }
> = {
 UP: {
  label: "Up",
  dot: "bg-emerald-500",
  pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
 },
 DOWN: {
  label: "Down",
  dot: "bg-red-500",
  pill: "border-red-500/30 bg-red-500/10 text-red-400",
 },
 PENDING: {
  label: "Checked soon",
  dot: "bg-amber-500",
  pill: "border-amber-500/30 bg-amber-500/10 text-amber-400",
 },
};

const TAG_META: Record<IncidentTag, { label: string; pill: string }> = {
 investigating: {
  label: "Investigating",
  pill: "border-red-500/30 bg-red-500/10 text-red-400",
 },
 identified: {
  label: "Identified",
  pill: "border-amber-500/30 bg-amber-500/10 text-amber-400",
 },
 monitoring: {
  label: "Monitoring",
  pill: "border-sky-500/30 bg-sky-500/10 text-sky-400",
 },
 resolved: {
  label: "Resolved",
  pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
 },
};

/** A single hoverable bar in the history strip. */
function HistoryBar({
 status,
 url,
 start,
 end,
}: {
 status: SiteStatus;
 url: string;
 start: string;
 end: string | null;
}) {
 const meta = STATUS_META[status];
 const color =
  status === "UP"
   ? "bg-emerald-500"
   : status === "DOWN"
    ? "bg-red-500"
    : "bg-amber-500";

 // How long this state lasted (or has lasted, if ongoing).
 const durMs =
  (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
 const lasted = humanizeDuration(durMs);

 return (
  <div className="group/bar relative flex-1">
   <div
    className={cn(
     "h-7 w-full rounded-[3px] transition-opacity hover:opacity-80",
     color
    )}
   />
   {/* Tooltip */}
   <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md  border border-border bg-popover px-2.5 py-1.5 text-left shadow-xl group-hover/bar:block">
    <p className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
     <span className={cn("size-1.5 rounded-full", meta.dot)} />
     {meta.label}
     <span className="text-muted-foreground">· {lasted}</span>
    </p>
    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
     {formatFull(start)}
     {end ? ` → ${formatFull(end)}` : " → now"}
    </p>
    <p className="font-mono text-[10px] text-muted-foreground">
     {end ? `lasted ${lasted}` : `${lasted} so far`}
    </p>
    <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">
     {url}
    </p>
   </div>
  </div>
 );
}

/** The merged incident log (auto status changes + manual updates). */
function IncidentLog({ timeline }: { timeline: TimelineEntry[] }) {
 if (timeline.length === 0) return null;

 return (
  <div className="mt-3  border-t border-border pt-3">
   <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
    incident log
   </p>
   <ol className="space-y-2.5">
    {timeline.map((entry) => (
     <li key={`${entry.kind}-${entry.id}`} className="flex gap-2.5">
      {/* Timeline gutter dot */}
      <div className="mt-1 flex flex-col items-center">
       <span
        className={cn(
         "size-2 shrink-0 rounded-full",
         entry.kind === "auto"
          ? entry.status === "UP"
           ? "bg-emerald-500"
           : entry.status === "DOWN"
            ? "bg-red-500"
            : "bg-amber-500"
          : "bg-foreground/60"
        )}
       />
      </div>

      <div className="min-w-0 flex-1">
       {entry.kind === "auto" ? (
        <p className="text-xs">
         <span
          className={
           entry.status === "UP"
            ? "text-emerald-400"
            : entry.status === "DOWN"
             ? "text-red-400"
             : "text-amber-400"
          }
         >
          {entry.status === "UP"
           ? "Recovered"
           : entry.status === "DOWN"
            ? "Went down"
            : "Pending"}
         </span>
         {entry.previousDuration ? (
          <span className="text-muted-foreground">
           {" "}
           · previous state lasted {entry.previousDuration}
          </span>
         ) : null}
        </p>
       ) : (
        <div>
         <div className="flex flex-wrap items-center gap-1.5">
          <span
           className={cn(
            "inline-flex items-center rounded-full  border border-border px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide",
            TAG_META[entry.tag].pill
           )}
          >
           {TAG_META[entry.tag].label}
          </span>
          <span className="text-xs font-medium">{entry.title}</span>
         </div>
         {entry.body ? (
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
           {entry.body}
          </p>
         ) : null}
        </div>
       )}
       <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
        {formatFull(entry.at)} · {timeAgo(entry.at)}
       </p>
      </div>
     </li>
    ))}
   </ol>
  </div>
 );
}

function SiteRow({
 site,
 actionSlot,
 incidentSlot,
 showIncidents = true,
}: {
 site: StatusSite;
 actionSlot?: (site: StatusSite) => React.ReactNode;
 incidentSlot?: (site: StatusSite) => React.ReactNode;
 showIncidents?: boolean;
}) {

 const segments = buildHistory(site, site.events);
 const meta = STATUS_META[site.status] ?? STATUS_META.PENDING;
 const display = site.title?.trim() || site.url;

 // The current segment (last one) tells us how long the present state has held.
 const current = segments[segments.length - 1];
 const sinceMs = current
  ? Date.now() - new Date(current.start).getTime()
  : 0;
 const since = humanizeDuration(sinceMs);

 // 30-day uptime percentage.
 const uptime = uptimePercent(site, site.events, 30);

 // Merged incident timeline.
 const timeline = React.useMemo(
  () => buildTimeline(site.events, site.incidents),
  [site.events, site.incidents]
 );

 return (
  <div className="border-t px-4 py-4 last:border-b-0">
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
     <div className="flex items-center gap-2">
      <span className="truncate text-sm font-medium">{display}</span>
      <span
       className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full  border border-border px-2 py-0.5 font-mono text-[10px] font-medium",
        meta.pill
       )}
      >
       <span className={cn("size-1.5 rounded-full", meta.dot)} />
       {meta.label}
      </span>
     </div>
     {site.title?.trim() ? (
      <a
       href={site.url}
       target="_blank"
       rel="noopener noreferrer"
       className="truncate font-mono text-[11px] text-muted-foreground hover:underline"
      >
       {site.url}
      </a>
     ) : null}
    </div>

    <div className="flex shrink-0 items-center gap-3">
     {uptime !== null ? (
      <span
       className="font-mono text-[11px] tabular-nums text-muted-foreground"
       title="Uptime over the last 30 days"
      >
       {uptime.toFixed(uptime >= 99.95 ? 2 : 1)}%
       <span className="ml-1 hidden text-muted-foreground/60 sm:inline">
        30d
       </span>
      </span>
     ) : null}
     {actionSlot ? actionSlot(site) : null}
    </div>
   </div>

   {/* History strip — green/red/amber bars, hover for detail */}
   <div className="mt-3 flex items-end gap-1">
    {segments.map((seg, i) => (
     <HistoryBar
      key={i}
      status={seg.status}
      url={site.url}
      start={seg.start}
      end={seg.end}
     />
    ))}
   </div>

   <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
    {site.status === "PENDING"
     ? "Awaiting first check…"
     : `${meta.label} for ${since}`}
    {site.last_checked_at
     ? ` · checked ${timeAgo(site.last_checked_at)}`
     : ""}
   </p>

   {/* Owner/admin "post update" control (dashboard only) */}
   {incidentSlot ? <div className="mt-3">{incidentSlot(site)}</div> : null}

   {showIncidents ? <IncidentLog timeline={timeline} /> : null}
  </div>
 );
}


/**
 * Shared status board — the same component renders on the dashboard, the public
 * status page, and inside the embeddable widget.
 */
export function StatusBoard({
 sites,
 actionSlot,
 incidentSlot,
 showIncidents = true,
}: {
 sites: StatusSite[];
 actionSlot?: (site: StatusSite) => React.ReactNode;
 incidentSlot?: (site: StatusSite) => React.ReactNode;
 showIncidents?: boolean;
}) {
 if (sites.length === 0) {
  return (
   <div className="rounded-md  border border-border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
    No services are being monitored yet.
   </div>
  );
 }

 return (
  <div className="overflow-hidden rounded-md  border border-border bg-card">
   {sites.map((site) => (
    <SiteRow
     key={site.id}
     site={site}
     actionSlot={actionSlot}
     incidentSlot={incidentSlot}
     showIncidents={showIncidents}
    />
   ))}
  </div>
 );
}

