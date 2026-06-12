/**
 * Flairs are required, owner-defined tags attached to every post (e.g.
 * "general", "bug"). Every board starts with the single base flair below
 * ("general"); owners on the Startup plan can add custom flairs. This module
 * centralises the defaults + badge styling so the public board, post detail and
 * dashboard stay visually consistent.
 */
export const BASE_FLAIRS = ["general"] as const;

/** The one flair every board always has and that can never be removed. */
export const DEFAULT_FLAIR = "general";

/**
 * Deterministic colour palette for flair chips. The base flairs get fixed
 * colours; any custom flair is hashed onto the remaining palette so it stays
 * stable across renders.
 */
const FIXED: Record<string, string> = {
  general: "bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/25",
  feedback: "bg-indigo-500/10 text-indigo-300 ring-1 ring-inset ring-indigo-500/25",
  bug: "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/25",
};


const PALETTE = [
  "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  "bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/25",
  "bg-fuchsia-500/10 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/25",
  "bg-teal-500/10 text-teal-300 ring-1 ring-inset ring-teal-500/25",
  "bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/25",
];

export function flairBadgeClass(flair: string): string {
  const key = flair.toLowerCase();
  if (FIXED[key]) return FIXED[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Normalises a raw flair string: trimmed, lowercased, single-spaced. */
export function normalizeFlair(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
