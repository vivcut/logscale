import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRoadmapPosts } from "@/lib/roadmap";
import { RoadmapBoard } from "@/components/roadmap-board";

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
    .select("id, name, slug, logo_url, roadmap_enabled")
    .eq("slug", workspaceSlug)
    .single();

  // Roadmap hidden from public view (toggle off) → 404. Data is preserved.
  if (!workspace || workspace.roadmap_enabled === false) notFound();


  const posts = await getRoadmapPosts(workspace.id);

  return (

    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
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
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {workspace.name} / roadmap
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              Product Roadmap
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Shared roadmap board — identical to the widget's roadmap tab. */}
        <RoadmapBoard posts={posts} />
      </main>

    </div>
  );
}
