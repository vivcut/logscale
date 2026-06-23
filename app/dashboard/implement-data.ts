import "server-only";

import type { ImplementItem, ImplementSection } from "./implement-sections";

const WORKER_ENDPOINT = "https://summer-cherry-c965.vivaancut.workers.dev/";

// Sections we surface, in priority order, with their dot colours.
const SECTION_DEFS = [
  { key: "under-review", label: "Under review", dot: "bg-zinc-400" },
  { key: "planned", label: "Planned", dot: "bg-blue-500" },
  { key: "in-progress", label: "In progress", dot: "bg-indigo-00" },
] as const;

// Per-section cap so the page stays fast (and AI calls stay bounded).
const PER_SECTION = 3;

export type ImplementInputPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  comments_count: number;
  board_id: string;
};

/**
 * Builds the "what to build next" sections for the overview. Pure/synchronous:
 * it groups posts by status (under-review / planned / in-progress), sorts each
 * group by upvotes, caps to the top 3, and attaches each item's board name and
 * comment count. The one-line AI gist is fetched separately on the client (see
 * /api/boards/summaries) so it never blocks the page render.
 */
export function buildImplementSections(
  posts: ImplementInputPost[],
  boards: { id: string; slug: string; name: string }[]
): ImplementSection[] {
  if (boards.length === 0) {
    return SECTION_DEFS.map((s) => ({ ...s, items: [] }));
  }

  const boardById = Object.fromEntries(boards.map((b) => [b.id, b]));

  return SECTION_DEFS.map((def) => {
    const items = posts
      .filter((p) => p.status === def.key)
      .sort((a, b) => b.upvotes_count - a.upvotes_count)
      .slice(0, PER_SECTION)
      .map<ImplementItem>((p) => {
        const board = boardById[p.board_id];
        return {
          id: p.id,
          title: p.title,
          upvotes_count: p.upvotes_count,
          comments_count: p.comments_count,
          boardSlug: board?.slug ?? null,
          boardName: board?.name ?? null,
          summary: null,
        };
      });
    return { key: def.key, label: def.label, dot: def.dot, items };
  });
}

// Short, deterministic fallback when the AI worker is unavailable: trim the
// description (or fall back to the title) so the UI is never empty.
function fallbackSummary(post: {
  title: string;
  description: string | null;
}): string {
  const text = (post.description ?? "").trim();
  if (!text) return "";
  return text.length > 110 ? `${text.slice(0, 107)}…` : text;
}

/**
 * Ask the AI worker for a one-line gist of a single post. Times out quickly and
 * falls back to a trimmed description so a slow/unavailable worker never breaks
 * the summaries endpoint. Used by /api/boards/summaries.
 */
export async function summarizePost(post: {
  title: string;
  description: string | null;
}): Promise<string> {
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
