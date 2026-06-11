import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { CommandPalette } from "@/components/command-palette";
import { FeedbackBoard, type PublicPost } from "./feedback-board";


type PageParams = {
  workspaceSlug: string;
  boardSlug: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { boardSlug } = await params;
  return {
    title: `${boardSlug} — Feedback`,
  };
}

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug, boardSlug } = await params;
  const supabase = createAdminClient();

  // Resolve workspace by slug.
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug, logo_url")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) notFound();

  // Resolve board within that workspace.
  const { data: board } = await supabase
    .from("boards")
    .select("id, name, slug, description, is_private, flairs")
    .eq("workspace_id", workspace.id)
    .eq("slug", boardSlug)
    .single();

  if (!board || board.is_private) notFound();

  // Initial posts, sorted by top (upvotes) — hydrated client-side afterwards.
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, description, status, upvotes_count, flair, created_at")
    .eq("board_id", board.id)
    .order("upvotes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);


  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-sm font-bold text-primary-foreground">
            {workspace.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="size-full object-cover"
              />
            ) : (
              workspace.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">
              {workspace.name} / feedback
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {board.name}
            </h1>
          </div>
          <CommandPalette workspaceSlug={workspace.slug} />
        </div>

      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {board.description ? (
          <p className="mb-6 text-sm text-muted-foreground">
            {board.description}
          </p>
        ) : null}

        <FeedbackBoard
          boardId={board.id}
          workspaceSlug={workspace.slug}
          boardSlug={board.slug}
          flairs={(board.flairs ?? ["feedback", "bug"]) as string[]}
          initialPosts={(posts ?? []) as PublicPost[]}
        />


      </main>
    </div>
  );
}
