import { createAdminClient } from "@/lib/supabase/admin";

export type SiteStatus = "UP" | "DOWN" | "PENDING";

export type IncidentTag =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export type MonitoredSite = {
  id: string;
  title: string | null;
  url: string;
  status: SiteStatus;
  last_checked_at: string | null;
  created_at: string;
};

export type StatusEvent = {
  id: string;
  site_id: string;
  status: SiteStatus;
  created_at: string;
};

export type Incident = {
  id: string;
  site_id: string;
  title: string;
  body: string | null;
  tag: IncidentTag;
  created_at: string;
};

/**
 * A single contiguous "segment" of uptime history reconstructed from the
 * change-log. Because we only persist status CHANGES, each event marks the
 * start of a segment that runs until the next change (or "now" for the latest).
 */
export type HistorySegment = {
  status: SiteStatus;
  start: string; // ISO — when this status began
  end: string | null; // ISO — when it changed (null = still ongoing)
};

/**
 * Turn a site's sparse change-log into ordered segments. Even though we store
 * only changes, this yields a continuous timeline the UI can render as a row of
 * green/red bars ("up since X → down at Y → up since Z").
 */
export function buildHistory(
  site: MonitoredSite,
  events: StatusEvent[]
): HistorySegment[] {
  // Oldest → newest.
  const ordered = [...events].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (ordered.length === 0) {
    // No recorded changes yet. If the site has been checked we still show one
    // ongoing segment; otherwise it's pending.
    return [
      {
        status: site.status,
        start: site.created_at,
        end: null,
      },
    ];
  }

  const segments: HistorySegment[] = [];
  for (let i = 0; i < ordered.length; i++) {
    segments.push({
      status: ordered[i].status,
      start: ordered[i].created_at,
      end: i < ordered.length - 1 ? ordered[i + 1].created_at : null,
    });
  }
  return segments;
}

/**
 * Compute the uptime percentage over a trailing window (default 30 days) from
 * the change-log. We clip each UP/DOWN segment to the window and divide UP time
 * by total measured time. PENDING segments (never checked) are ignored so a
 * brand-new monitor doesn't report a misleading number.
 */
export function uptimePercent(
  site: MonitoredSite,
  events: StatusEvent[],
  windowDays = 30
): number | null {
  const now = Date.now();
  const windowStart = now - windowDays * 24 * 60 * 60 * 1000;
  const segments = buildHistory(site, events);

  let upMs = 0;
  let measuredMs = 0;

  for (const seg of segments) {
    if (seg.status === "PENDING") continue;
    const segStart = new Date(seg.start).getTime();
    const segEnd = seg.end ? new Date(seg.end).getTime() : now;

    // Clip to the trailing window.
    const start = Math.max(segStart, windowStart);
    const end = Math.min(segEnd, now);
    if (end <= start) continue;

    const dur = end - start;
    measuredMs += dur;
    if (seg.status === "UP") upMs += dur;
  }

  if (measuredMs === 0) return null;
  return (upMs / measuredMs) * 100;
}

/**
 * How long the site's CURRENT status has held, as a human string ("5m", "3h",
 * "2d"). Returns null when there's no history to measure from.
 */
export function currentStateSince(
  site: MonitoredSite,
  events: StatusEvent[]
): string | null {
  const segments = buildHistory(site, events);
  const current = segments[segments.length - 1];
  if (!current) return null;
  const diff = Date.now() - new Date(current.start).getTime();
  return humanizeDuration(diff);
}

/** Compact duration: "just now", "5m", "3h", "2d". */
export function humanizeDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * A unified incident-log entry — either an automatic status change derived from
 * the checker, or a manual update written by the team. Both render in one
 * chronological timeline.
 */
export type TimelineEntry =
  | {
      kind: "auto";
      id: string;
      at: string;
      status: SiteStatus;
      /** How long the PREVIOUS state lasted before this change (human string). */
      previousDuration: string | null;
    }
  | {
      kind: "manual";
      id: string;
      at: string;
      title: string;
      body: string | null;
      tag: IncidentTag;
    };

/**
 * Merge automatic status changes + manual incident updates into one timeline,
 * newest first. For auto-entries we annotate how long the prior state lasted
 * (e.g. "Failed for 5m, then recovered").
 */
export function buildTimeline(
  events: StatusEvent[],
  incidents: Incident[]
): TimelineEntry[] {
  const orderedEvents = [...events].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const autoEntries: TimelineEntry[] = orderedEvents.map((e, i) => {
    let previousDuration: string | null = null;
    if (i > 0) {
      const prev = orderedEvents[i - 1];
      previousDuration = humanizeDuration(
        new Date(e.created_at).getTime() - new Date(prev.created_at).getTime()
      );
    }
    return {
      kind: "auto",
      id: e.id,
      at: e.created_at,
      status: e.status,
      previousDuration,
    };
  });

  const manualEntries: TimelineEntry[] = incidents.map((inc) => ({
    kind: "manual",
    id: inc.id,
    at: inc.created_at,
    title: inc.title,
    body: inc.body,
    tag: inc.tag,
  }));

  return [...autoEntries, ...manualEntries].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

/**
 * Loads a workspace's monitored sites plus their status-change history and
 * manual incident updates, using the service-role admin client (safe on the
 * server / public pages).
 */
export async function getWorkspaceStatus(workspaceId: string): Promise<{
  sites: MonitoredSite[];
  eventsBySite: Record<string, StatusEvent[]>;
  incidentsBySite: Record<string, Incident[]>;
}> {
  const supabase = createAdminClient();

  const { data: sitesRaw } = await supabase
    .from("monitored_sites")
    .select("id, title, url, status, last_checked_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  const sites = (sitesRaw ?? []) as MonitoredSite[];
  const eventsBySite: Record<string, StatusEvent[]> = {};
  const incidentsBySite: Record<string, Incident[]> = {};
  for (const s of sites) {
    eventsBySite[s.id] = [];
    incidentsBySite[s.id] = [];
  }

  if (sites.length > 0) {
    const siteIds = sites.map((s) => s.id);

    const [{ data: events }, { data: incidents }] = await Promise.all([
      supabase
        .from("site_status_events")
        .select("id, site_id, status, created_at")
        .in("site_id", siteIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("site_incidents")
        .select("id, site_id, title, body, tag, created_at")
        .in("site_id", siteIds)
        .order("created_at", { ascending: false }),
    ]);

    for (const e of (events ?? []) as StatusEvent[]) {
      (eventsBySite[e.site_id] ??= []).push(e);
    }
    for (const inc of (incidents ?? []) as Incident[]) {
      (incidentsBySite[inc.site_id] ??= []).push(inc);
    }
  }

  return { sites, eventsBySite, incidentsBySite };
}
