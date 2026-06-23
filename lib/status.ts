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
  "bg-zinc-400/50 text-black font-bold",
 planned:
  "bg-blue-400/50 text-black font-bold",
 "in-progress":
  "bg-amber-400/50 text-black font-bold",
 completed:
  "bg-emerald-400/50 text-black font-bold",
 closed:
  "bg-rose-400/50 text-black font-bold",
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
