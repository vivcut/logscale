import { redirect } from "next/navigation";

type PageParams = { workspaceSlug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  return { title: `${workspaceSlug} — Contact` };
}

export default async function PublicContactPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  // Redirect to unified dashboard with contact tab selected
  redirect(`/public/${workspaceSlug}?tab=contact`);
}
