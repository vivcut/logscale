/**
 * Canonical post statuses + their presentation metadata, shared across the
 * dashboard, public board, roadmap and widget so colour coding stays
 * consistent everywhere.
 */
export const STATUS_LABELS: Record<string, string> = {
  "under-review": "under review",
  planned: "planned",
  "in-progress": "in progress",
  completed: "completed",
  closed: "closed",
};

/**
 * Tailwind class sets for each status badge (Polar-style: tinted text on a
 * faint matching background with a subtle ring).
 */
export const STATUS_BADGE: Record<string, string> = {
  "under-review":
    "bg-zinc-500/10 text-zinc-400 ring-1 ring-inset ring-zinc-500/20",
  planned:
    "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20",
  "in-progress":
    "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
  completed:
    "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
  closed:
    "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20",
};

/** Solid dot colour for status, used in compact lists. */
export const STATUS_DOT: Record<string, string> = {
  "under-review": "bg-zinc-400",
  planned: "bg-blue-400",
  "in-progress": "bg-amber-400",
  completed: "bg-emerald-400",
  closed: "bg-rose-400",
};

/**
 * Default presentation order: completed first, then in-progress, planned,
 * under-review. "closed" is ranked last (and usually hidden).
 */
export const STATUS_ORDER = [
  "completed",
  "in-progress",
  "planned",
  "under-review",
  "closed",
] as const;

export function statusRank(status: string): number {
  const i = STATUS_ORDER.indexOf(status as (typeof STATUS_ORDER)[number]);
  return i === -1 ? STATUS_ORDER.length : i;
}

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE[status] ?? STATUS_BADGE["under-review"];
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
