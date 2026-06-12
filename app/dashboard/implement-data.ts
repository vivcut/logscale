import "server-only";

import type { ImplementItem, ImplementSection } from "./implement-sections";

const WORKER_ENDPOINT = "https://summer-cherry-c965.vivaancut.workers.dev/";

// Sections we surface, in priority order, with their dot colours.
const SECTION_DEFS = [
  { key: "under-review", label: "Under review", dot: "bg-zinc-400" },
  { key: "planned", label: "Planned", dot: "bg-blue-500" },
  { key: "in-progress", label: "In progress", dot: "bg-indigo-500" },
] as const;

// Per-section cap so the page stays fast (and AI calls stay bounded).
const PER_SECTION = 4;

export type ImplementInputPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  board_id: string;
};

// Short, deterministic fallback when the AI worker is unavailable: trim the
// description (or fall back to the title) so the UI is never empty.
function fallbackSummary(post: ImplementInputPost): string {
  const text = (post.description ?? "").trim();
  if (!text) return "";
  return text.length > 110 ? `${text.slice(0, 107)}…` : text;
}

// Ask the AI worker for a one-line gist. Times out quickly and falls back so a
// slow/unavailable worker never blocks the dashboard.
async function summarize(post: ImplementInputPost): Promise<string> {
  const fallback = fallbackSummary(post);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "summary",
        title: post.title,
        description: post.description ?? "",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return fallback;
    const json = (await res.json()) as { summary?: string; error?: string };
    return (json.summary || "").trim() || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Builds the "what to build next" sections for the overview. Takes posts
 * already scraped from every board in the workspace, groups them by status
 * (under-review / planned / in-progress), sorts each group by upvotes, caps it,
 * and attaches a short AI-generated summary to each item.
 */
export async function buildImplementSections(
  posts: ImplementInputPost[],
  boards: { id: string; slug: string }[]
): Promise<ImplementSection[]> {
  if (boards.length === 0) {
    return SECTION_DEFS.map((s) => ({ ...s, items: [] }));
  }

  const slugByBoard = Object.fromEntries(boards.map((b) => [b.id, b.slug]));

  // Collect the capped, vote-sorted posts per section first…
  const grouped = SECTION_DEFS.map((def) => {
    const items = posts
      .filter((p) => p.status === def.key)
      .sort((a, b) => b.upvotes_count - a.upvotes_count)
      .slice(0, PER_SECTION);
    return { def, items };
  });

  // …then summarize every selected post in parallel.
  const flat = grouped.flatMap((g) => g.items);
  const summaries = new Map<string, string>();
  await Promise.all(
    flat.map(async (p) => {
      summaries.set(p.id, await summarize(p));
    })
  );

  return grouped.map(({ def, items }) => ({
    key: def.key,
    label: def.label,
    dot: def.dot,
    items: items.map<ImplementItem>((p) => ({
      id: p.id,
      title: p.title,
      upvotes_count: p.upvotes_count,
      boardSlug: slugByBoard[p.board_id] ?? null,
      summary: summaries.get(p.id) ?? null,
    })),
  }));
}
