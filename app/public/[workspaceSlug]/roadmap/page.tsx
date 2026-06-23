import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRoadmapPosts } from "@/lib/roadmap";
import { RoadmapBoard } from "@/components/roadmap-board";
import { Watermark } from "@/components/watermark";

type PageParams = { workspaceSlug: string };

export async function generateMetadata({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { workspaceSlug } = await params;
 return { title: `${workspaceSlug} — Roadmap` };
}

export default async function PublicRoadmapPage({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { workspaceSlug } = await params;
 const supabase = createAdminClient();

 const { data: workspace } = await supabase
  .from("workspaces")
  .select("id, name, slug, roadmap_enabled")
  .eq("slug", workspaceSlug)
  .single();

 if (!workspace || !workspace.roadmap_enabled) notFound();

 const posts = await getRoadmapPosts(workspace.id);

 return (
  <main className="mx-auto max-w-7xl px-6 py-8">
   {posts.length === 0 ? (
    <div className="text-center py-12">
     <p className="text-muted-foreground text-xl">No roadmap items yet</p>
    </div>
   ) : (
    <RoadmapBoard posts={posts} workspaceSlug={workspaceSlug} />
   )}
   <Watermark workspaceId={workspace.id} />
  </main>
 );
}
