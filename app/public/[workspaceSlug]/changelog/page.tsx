import { redirect } from "next/navigation";

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
  // Redirect to unified dashboard with changelog tab selected
  redirect(`/public/${workspaceSlug}?tab=changelog`);
}
