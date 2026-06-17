import { redirect } from "next/navigation";

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
  // Redirect to unified dashboard with roadmap tab selected
  redirect(`/public/${workspaceSlug}?tab=roadmap`);
}
