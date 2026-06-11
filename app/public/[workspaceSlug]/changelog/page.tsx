import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  ChangelogTimeline,
  type ChangelogEntry,
} from "@/components/changelog-timeline";

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
    .select("id, name, slug, logo_url, changelog_enabled")
    .eq("slug", workspaceSlug)
    .single();

  // Hide entirely when the owner has disabled the public changelog.
  if (!workspace || workspace.changelog_enabled === false) notFound();


  // Only published entries, newest first.
  const { data: entries } = await supabase
    .from("changelogs")
    .select("id, title, content, published_at")
    .eq("workspace_id", workspace.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  const list = entries ?? [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
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
              {workspace.name} / changelog
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              What&apos;s new
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/*
          Vertical timeline rendered by the shared <ChangelogTimeline />, so the
          public page and the embeddable widget stay perfectly in sync.
        */}
        <ChangelogTimeline entries={list as ChangelogEntry[]} />
      </main>

    </div>
  );
}
