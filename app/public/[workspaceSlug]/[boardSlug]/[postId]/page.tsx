import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "@/components/icons";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { getActiveWorkspace } from "@/lib/workspace";
import { Watermark } from "@/components/watermark";

import {
 PostDetail,
 type DetailPost,
 type StatusEvent,
 type PostAttachment,
} from "./post-detail";

type PageParams = {
 workspaceSlug: string;
 boardSlug: string;
 postId: string;
};

export async function generateMetadata({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { postId } = await params;
 const supabase = createAdminClient();
 const { data: post } = await supabase
  .from("posts")
  .select("title")
  .eq("id", postId)
  .single();
 return { title: post?.title ? `${post.title} — Feedback` : "Feedback" };
}

export default async function PublicPostPage({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { workspaceSlug, boardSlug, postId } = await params;
 const supabase = createAdminClient();

 const { data: workspace } = await supabase
  .from("workspaces")
  .select("id, name, slug, logo_url, boards_enabled")
  .eq("slug", workspaceSlug)
  .single();

 // Boards hidden from public view (toggle off) → 404. Data is preserved.
 if (!workspace || workspace.boards_enabled === false) notFound();

 const { data: board } = await supabase
  .from("boards")
  .select("id, name, slug, is_private")
  .eq("workspace_id", workspace.id)
  .eq("slug", boardSlug)
  .single();

 if (!board || board.is_private) notFound();

  const { data: post } = await supabase
   .from("posts")
   .select(
    "id, board_id, title, description, status, upvotes_count, flair, is_official, author_name, user_id, created_at"
   )
   .eq("id", postId)
   .eq("board_id", board.id)
   .single();

 if (!post) notFound();

 // Fetch post author email for admin display
 let authorEmail: string | null = null;
 if (post.user_id) {
  const { data: authorAuth } = await supabase
   .from("profiles")
   .select("id")
   .eq("id", post.user_id)
   .single();
  if (authorAuth) {
   // Get the email from auth.users via admin client
   const { data: authUser } = await supabase.auth.admin.getUserById(post.user_id);
   authorEmail = authUser?.user?.email ?? null;
  }
 }

 // Dated status timeline (ascending so the journey reads top-to-bottom).
 const { data: events } = await supabase
  .from("post_status_events")
  .select("id, status, created_at")
  .eq("post_id", post.id)
  .order("created_at", { ascending: true });

 // Attachments (images shown inline, PDFs as clickable chips).
 const { data: attachments } = await supabase
  .from("post_attachments")
  .select("id, url, file_name, content_type, size")
  .eq("post_id", post.id)
  .order("created_at", { ascending: true });

 // Determine whether the current viewer can manage (pin comments etc.).
 let canManage = false;
 const active = await getActiveWorkspace().catch(() => null);
 if (
  active &&
  active.id === workspace.id &&
  (active.role === "owner" || active.role === "admin")
 ) {
  canManage = true;
 }

 // Determine if user is signed in (for comment form auth gate).
 let isSignedIn = false;
 const sessionClient = await createClient();
 const {
  data: { user },
 } = await sessionClient.auth.getUser();
 if (user) {
  isSignedIn = true;
 }

 return (
  <main className="mx-auto max-w-7xl px-6 py-8">
   <Link
    href={`/public/${workspace.slug}/${board.slug}`}
    className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
   >
    <ChevronLeft className="size-3.5" />
    back to {board.name}
   </Link>

   <PostDetail
    post={post as DetailPost}
    statusEvents={(events ?? []) as StatusEvent[]}
    attachments={(attachments ?? []) as PostAttachment[]}
    boardSlug={board.slug}
    canManage={canManage}
    isSignedIn={isSignedIn}
    workspaceName={workspace.name}
    authorEmail={canManage ? authorEmail : null}
   />

   {/* Hobby-plan watermark (removed on Startup). */}
   <Watermark workspaceId={workspace.id} />
  </main>
 );
}
