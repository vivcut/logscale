import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
 ChangelogTimeline,
 type ChangelogEntry,
} from "@/components/changelog-timeline";
import { Watermark } from "@/components/watermark";

type PageParams = { workspaceSlug: string };

export async function generateMetadata({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { workspaceSlug } = await params;
 return { title: `${workspaceSlug} — Changelog` };
}

export default async function PublicChangelogPage({
 params,
}: {
 params: Promise<PageParams>;
}) {
 const { workspaceSlug } = await params;
 const supabase = createAdminClient();

 const { data: workspace } = await supabase
  .from("workspaces")
  .select("id, name, slug, changelog_enabled")
  .eq("slug", workspaceSlug)
  .single();

 if (!workspace || !workspace.changelog_enabled) notFound();

 const { data } = await supabase
  .from("changelogs")
  .select("id, title, content, published_at")
  .eq("workspace_id", workspace.id)
  .not("published_at", "is", null)
  .order("published_at", { ascending: false });

 const entries: ChangelogEntry[] = data || [];

 return (
  <main className="mx-auto max-w-3xl px-6 py-8">
   <ChangelogTimeline entries={entries} />
   <Watermark workspaceId={workspace.id} />
  </main>
 );
}
