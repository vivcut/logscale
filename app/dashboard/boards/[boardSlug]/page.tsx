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
      `id, title, description, status, upvotes_count, category, created_at,
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

  const posts: AdminPost[] = ((postsRaw ?? []) as unknown as Row[]).map(
    (r) => {
      const author = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        upvotes_count: r.upvotes_count,
        category: r.category,
        created_at: r.created_at,
        admin_notes: r.admin_notes,
        pinned_response: r.pinned_response,
        merged_into_id: r.merged_into_id,
        fingerprint_hash: r.fingerprint_hash,
        author_name: r.author_name,
        author_email: r.author_email,
        author: author ?? null,
      };

    }
  );

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

  // Active voters: unique users + fingerprints across this board's upvotes.
  let activeVoters = 0;
  if (postIds.length > 0) {
    const { data: votes } = await supabase
      .from("upvotes")
      .select("user_id, fingerprint_hash")
      .in("post_id", postIds);
    const ids = new Set<string>();
    for (const v of votes ?? []) {
      ids.add(v.user_id ? `u:${v.user_id}` : `f:${v.fingerprint_hash}`);
    }
    activeVoters = ids.size;
  }

  // Top requested category.
  const catCounts: Record<string, number> = {};
  for (const p of posts) {
    if (p.category) catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
  }
  const topCategory =
    Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

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
        activeVoters,
        topCategory,
      }}
    />
  );
}
