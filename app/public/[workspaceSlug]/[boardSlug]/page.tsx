import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { Watermark } from "@/components/watermark";
import { FeedbackBoard, type PublicPost, type BoardSummary } from "./feedback-board";

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

 if (!workspace || workspace.boards_enabled === false) notFound();

 // Resolve board within that workspace.
 const { data: board } = await supabase
  .from("boards")
  .select("id, name, slug, description, is_private, flairs")
  .eq("workspace_id", workspace.id)
  .eq("slug", boardSlug)
  .single();

 if (!board || board.is_private) notFound();

 // Get all public boards for the sidebar
 const { data: allBoards } = await supabase
  .from("boards")
  .select("id, name, slug, is_private")
  .eq("workspace_id", workspace.id)
  .eq("is_private", false);

 // Get post counts per board
 const boardSummaries: BoardSummary[] = [];
 if (allBoards) {
  for (const b of allBoards) {
   const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("board_id", b.id);
   boardSummaries.push({
    id: b.id,
    name: b.name,
    slug: b.slug,
    post_count: count ?? 0,
   });
  }
 }

 // Initial posts
 const { data: posts } = await supabase
  .from("posts")
  .select(
   "id, title, description, status, upvotes_count, flair, is_official, author_name, created_at"
  )
  .eq("board_id", board.id)
  .order("upvotes_count", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(100);

 // Check if user is signed in and is admin
 let isSignedIn = false;
 let isAdmin = false;
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (user) {
  isSignedIn = true;
  const { data: membership } = await supabase
   .from("workspace_members")
   .select("role")
   .eq("workspace_id", workspace.id)
   .eq("profile_id", user.id)
   .maybeSingle();
  if (membership) {
   isAdmin = true;
  }
 }

 return (
  <main className="mx-auto max-w-7xl px-6 py-8">
   <FeedbackBoard
    boardId={board.id}
    boardName={board.name}
    workspaceSlug={workspace.slug}
    workspaceName={workspace.name}
    boardSlug={board.slug}
    flairs={(board.flairs ?? ["general"]) as string[]}
    initialPosts={(posts ?? []) as PublicPost[]}
    boards={boardSummaries}
    isSignedIn={isSignedIn}
    isAdmin={isAdmin}
   />

   <Watermark workspaceId={workspace.id} />
  </main>
 );
}
