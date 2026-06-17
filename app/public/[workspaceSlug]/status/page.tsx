import { redirect } from "next/navigation";

type PageParams = { workspaceSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  return { title: `${workspaceSlug} — Status` };
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  // Redirect to unified dashboard with status tab selected
  redirect(`/public/${workspaceSlug}?tab=status`);
}
