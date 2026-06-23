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
 general: "bg-indigo-400/50 text-black font-bold",
 feedback: "bg-indigo-400/50 text-black font-bold",
 bug: "bg-rose-400/50 text-black font-bold",
};


const PALETTE = [
 "bg-emerald-400/50 text-black font-bold",
 "bg-amber-400/50 text-black font-bold",
 "bg-sky-400/50 text-black font-bold",
 "bg-fuchsia-400/50 text-black font-bold",
 "bg-teal-400/50 text-black font-bold",
 "bg-orange-400/50 text-black font-bold",
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
