import { getActiveWorkspace } from "@/lib/workspace";
import { getRoadmapPosts } from "@/lib/roadmap";
import { RoadmapKanban } from "./kanban";
import { PlanBanner } from "@/components/plan-banner";
import { ShareLink } from "@/components/share-link";



export const metadata = {
  title: "Roadmap — ToTheMoon",
};

export default async function RoadmapPage() {
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h1 className="text-sm font-medium">No active workspace</h1>
        </div>
      </div>
    );
  }

  const posts = await getRoadmapPosts(workspace.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground">/roadmap</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag feedback through the pipeline. Status changes are saved instantly
          and reflected on your public roadmap.
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-1.5 font-mono text-xs text-muted-foreground">
          public roadmap link
        </p>
        <ShareLink
          url={`/public/${workspace.slug}/roadmap`}
          label={`${workspace.name} roadmap`}
        />
      </div>

      <PlanBanner page="roadmap" />

      <RoadmapKanban posts={posts} />


    </div>
  );
}
