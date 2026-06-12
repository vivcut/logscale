import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { AdminBoard, type AdminPost } from "./admin-board";

export const metadata = {
  title: "Board — ToTheMoon",
};

type PageParams = { boardSlug: string };

export default async function AdminBoardPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { boardSlug } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const supabase = await createClient();

  const { data: board } = await supabase
    .from("boards")
    .select("id, name, slug, description, is_private")
    .eq("workspace_id", workspace.id)
    .eq("slug", boardSlug)
    .maybeSingle();

  if (!board) notFound();

  // Posts with author profile joined in for the "user impact" column.
  const { data: postsRaw } = await supabase
    .from("posts")
    .select(
      `id, title, description, status, upvotes_count, category, flair, created_at,
       admin_notes, pinned_response, merged_into_id, fingerprint_hash,
       author_name, author_email,
       profiles ( id, name, email, avatar_url )`
    )

    .eq("board_id", board.id)
    .order("upvotes_count", { ascending: false })
    .order("created_at", { ascending: false });

  type Row = Omit<AdminPost, "author"> & {
    profiles: AdminPost["author"] | AdminPost["author"][] | null;
  };

  const baseRows = (postsRaw ?? []) as unknown as Row[];

  // Comment counts per post (shown on each row).
  const allPostIds = baseRows.map((r) => r.id);
  const commentCounts: Record<string, number> = {};
  if (allPostIds.length > 0) {
    const { data: comments } = await supabase
      .from("comments")
      .select("post_id")
      .in("post_id", allPostIds);
    for (const c of comments ?? []) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
    }
  }

  const posts: AdminPost[] = baseRows.map((r) => {
    const author = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      upvotes_count: r.upvotes_count,
      category: r.category,
      flair: r.flair ?? null,
      comments_count: commentCounts[r.id] ?? 0,
      created_at: r.created_at,
      admin_notes: r.admin_notes,
      pinned_response: r.pinned_response,
      merged_into_id: r.merged_into_id,
      fingerprint_hash: r.fingerprint_hash,
      author_name: r.author_name,
      author_email: r.author_email,
      author: author ?? null,
    };
  });

  // Follower counts per post (broadcast reach).
  const postIds = posts.map((p) => p.id);
  const followerCounts: Record<string, number> = {};
  if (postIds.length > 0) {
    const { data: followers } = await supabase
      .from("post_followers")
      .select("post_id")
      .in("post_id", postIds);
    for (const f of followers ?? []) {
      followerCounts[f.post_id] = (followerCounts[f.post_id] ?? 0) + 1;
    }
  }

  // ---- Metrics ----
  const visible = posts.filter((p) => p.status !== "closed" || !p.merged_into_id);
  const totalPosts = posts.length;
  const unreviewed = posts.filter((p) => p.status === "under-review").length;
  const totalVotes = posts.reduce((acc, p) => acc + p.upvotes_count, 0);

  const canManage =
    workspace.role === "owner" || workspace.role === "admin";

  return (
    <AdminBoard
      boardSlug={board.slug}
      boardName={board.name}
      boardDescription={board.description}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
      canManage={canManage}
      posts={visible}
      followerCounts={followerCounts}
      metrics={{
        totalPosts,
        unreviewed,
        totalVotes,
      }}
    />
  );
}

