"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "@/components/icons";
import { ArrowFatUp, Trophy } from "@phosphor-icons/react";

interface PostItem {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  boardSlug: string;
}

export function ImportantFeaturesReport() {
  const [posts, setPosts] = React.useState<PostItem[]>([]);
  const [workspaceSlug, setWorkspaceSlug] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/boards/report");
        const json = await res.json();
        if (!cancelled) {
          setPosts(json.posts || []);
          setWorkspaceSlug(json.workspaceSlug || "");
        }
      } catch (error) {
        console.error("Failed to fetch top features:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mb-8 overflow-hidden rounded-xl  border-2 border-border  bg-card">
        <div className="flex items-center gap-2 border-b-2  px-4 py-2.5">
          <Sparkles className="size-3.5 text-chart-1 animate-pulse" />
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            loading top features...
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
          <div className="h-3 w-full rounded bg-secondary animate-pulse" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="mb-8 overflow-hidden rounded-xl  border-2 border-border  bg-card">
      {/* Header Panel */}
      <div className="flex items-center gap-2 border-b-2  p-4">
        <Trophy weight="fill" className="size-6 text-primary" />
        <h2 className="text-md tracking-wider text-muted-foreground">
          Most important features
        </h2>
        <span className="ml-auto text-[16px] text-muted-foreground">
          Top Voted
        </span>
      </div>

      {/* Main Content List */}
      <div className="p-4">
        <div className="grid gap-3">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/public/${workspaceSlug}/${post.boardSlug}/${post.id}`}
              className="flex items-start gap-4 p-3 rounded-lg bg-secondary/30  border-2 border-border  hover:bg-secondary/60 hover:border-border-hover transition-all group"
            >
              {/* Rank Counter Ring */}
              <div className="shrink-0 flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary  border-2 border-border border-primary/20 font-mono text-xs font-bold">
                {i + 1}
              </div>

              {/* Text metadata block */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {post.title}
                  </h4>
                  <span className="shrink-0 inline-flex items-center rounded-xl text-black bg-primary px-2 py-0.5 text-lg font-mono font-medium">
                     <ArrowFatUp weight="fill" className="size-4 mr-2" />
                     {post.upvotes}
                  </span>
                </div>
                {post.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}