"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUp,
  ChevronDown,
  ExternalLink,
  MessageSquare,
} from "@/components/icons";


import { cn } from "@/lib/utils";
import { statusBadgeClass, statusLabel } from "@/lib/status";

export type OverviewBoard = {
  id: string;
  name: string;
  slug: string;
};

export type OverviewPost = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  upvotes_count: number;
  comments_count?: number;
  board_id: string;
};


/**
 * Recent-feedback panel with a board switcher. Visitors land on "All boards"
 * but can scope to a single board; each row links straight to the public post.
 */
export function OverviewBoards({
  workspaceSlug,
  boards,
  posts,
}: {
  workspaceSlug: string;
  boards: OverviewBoard[];
  posts: OverviewPost[];
}) {
  const [activeId, setActiveId] = React.useState<string>("all");
  const [menuOpen, setMenuOpen] = React.useState(false);

  const boardById = React.useMemo(
    () => Object.fromEntries(boards.map((b) => [b.id, b])),
    [boards]
  );

  const activeBoard = activeId === "all" ? null : boardById[activeId];
  const filtered = (
    activeId === "all" ? posts : posts.filter((p) => p.board_id === activeId)
  ).slice(0, 8);

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          recent feedback
        </h2>

        {/* Board switcher */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs transition-colors hover:bg-secondary"
          >
            <MessageSquare className="size-3 text-muted-foreground" />
            {activeBoard ? activeBoard.name : "All boards"}
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
          {menuOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-xl">
                <button
                  onClick={() => {
                    setActiveId("all");
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary",
                    activeId === "all" && "bg-secondary"
                  )}
                >
                  All boards
                </button>
                {boards.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveId(b.id);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary",
                      activeId === b.id && "bg-secondary"
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center font-mono text-xs text-muted-foreground">
          no feedback in this board yet
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {filtered.map((p) => {
            const board = boardById[p.board_id];
            return (
              <li key={p.id} className="group flex items-center gap-3 bg-card">
                <Link
                  href={
                    board
                      ? `/public/${workspaceSlug}/${board.slug}/${p.id}`
                      : "#"
                  }
                  target="_blank"
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
                >
                  <span className="flex w-10 shrink-0 flex-col items-center rounded-md border border-border py-1.5 text-muted-foreground">
                    <ArrowUp className="size-3.5" />
                    <span className="font-mono text-xs tabular-nums">
                      {p.upvotes_count}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium transition-colors group-hover:text-foreground">
                      {p.title}
                    </span>
                    {typeof p.comments_count === "number" &&
                    p.comments_count > 0 ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                        <MessageSquare className="size-3" />
                        {p.comments_count}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] lowercase",
                      statusBadgeClass(p.status)
                    )}
                  >
                    {statusLabel(p.status)}
                  </span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />

                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
