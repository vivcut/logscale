import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export type SearchResult =
 | {
   type: "post";
   id: string;
   title: string;
   subtitle: string | null;
   status: string;
   boardSlug: string;
   href: string;
  }
 | {
   type: "changelog";
   id: string;
   title: string;
   subtitle: string | null;
   href: string;
  };

/**
 * GET /api/search?workspace=<slug>&q=<query>
 *
 * Powers the global Cmd/Ctrl+K command palette. Searches across all PUBLIC
 * feedback posts and PUBLISHED changelog entries in a workspace, returning a
 * unified, ranked-ish list. Goes through the service-role client so it works
 * for anonymous visitors on the public pages.
 */
export async function GET(request: NextRequest) {
 const { searchParams } = new URL(request.url);
 const workspaceSlug = searchParams.get("workspace");
 const q = searchParams.get("q")?.trim() ?? "";

 if (!workspaceSlug) {
  return NextResponse.json(
   { error: "workspace is required" },
   { status: 400 }
  );
 }

 const admin = createAdminClient();

 const { data: workspace } = await admin
  .from("workspaces")
  .select("id, slug")
  .eq("slug", workspaceSlug)
  .single();

 if (!workspace) {
  return NextResponse.json({ results: [] });
 }

 // Public boards in this workspace.
 const { data: boards } = await admin
  .from("boards")
  .select("id, slug")
  .eq("workspace_id", workspace.id)
  .eq("is_private", false);

 const boardList = boards ?? [];
 const boardMap = new Map(boardList.map((b) => [b.id, b.slug]));
 const boardIds = boardList.map((b) => b.id);

 const results: SearchResult[] = [];

 // ---- Posts ----
 if (boardIds.length > 0) {
  let postQuery = admin
   .from("posts")
   .select("id, title, description, status, board_id")
   .in("board_id", boardIds)
   .neq("status", "closed");

  if (q) postQuery = postQuery.ilike("title", `%${q}%`);

  const { data: posts } = await postQuery
   .order("upvotes_count", { ascending: false })
   .limit(8);

  for (const p of posts ?? []) {
   const boardSlug = boardMap.get(p.board_id) ?? "";
   results.push({
    type: "post",
    id: p.id,
    title: p.title,
    subtitle: p.description,
    status: p.status,
    boardSlug,
    href: `/public/${workspace.slug}/${boardSlug}`,
   });
  }
 }

 // ---- Changelogs ----
 let clQuery = admin
  .from("changelogs")
  .select("id, title, content")
  .eq("workspace_id", workspace.id)
  .not("published_at", "is", null);

 if (q) clQuery = clQuery.ilike("title", `%${q}%`);

 const { data: changelogs } = await clQuery
  .order("published_at", { ascending: false })
  .limit(5);

 for (const c of changelogs ?? []) {
  results.push({
   type: "changelog",
   id: c.id,
   title: c.title,
   subtitle: (c.content ?? "").replace(/[#*`_>\-]/g, "").slice(0, 80),
   href: `/public/${workspace.slug}/changelog`,
  });
 }

 return NextResponse.json({ results });
}
