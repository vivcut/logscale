import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { CommandPalette } from "@/components/command-palette";

import { Watermark } from "@/components/watermark";
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
    .select("id, name, slug, logo_url, boards_enabled")
    .eq("slug", workspaceSlug)
    .single();

  // Boards hidden from public view (toggle off) → 404. Data is preserved.
  if (!workspace || workspace.boards_enabled === false) notFound();


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
    .select(
      "id, title, description, status, upvotes_count, flair, is_official, author_name, created_at"
    )
    .eq("board_id", board.id)


    .order("upvotes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  // If the current viewer is a member of this workspace, lock the post form's
  // name/email to their profile so team-authored posts are always attributed.
  let teamName: string | null = null;
  let teamEmail: string | null = null;
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (user) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace.id)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (membership) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      teamName = profile?.name ?? user.email ?? "Team";
      teamEmail = user.email ?? null;
    }
  }

  return (

    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-2 border-popover/50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground">
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

      <main className="mx-auto max-w-7xl px-6 py-8">
        {board.description ? (
          <p className="mb-6 text-sm text-muted-foreground">
            {board.description}
          </p>
        ) : null}

        <FeedbackBoard
          boardId={board.id}
          workspaceSlug={workspace.slug}
          boardSlug={board.slug}
          flairs={(board.flairs ?? ["general"]) as string[]}
          initialPosts={(posts ?? []) as PublicPost[]}
          lockedName={teamName}
          lockedEmail={teamEmail}
        />


        <Watermark workspaceId={workspace.id} />
      </main>

    </div>
  );
}
