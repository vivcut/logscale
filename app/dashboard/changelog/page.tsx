import Link from "next/link";
import { Plus, Sparkles } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanBanner } from "@/components/plan-banner";
import { ShareLink } from "@/components/share-link";



export const metadata = {
  title: "Changelog — LogScale",
};

export default async function ChangelogPage() {
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h1 className="text-sm font-medium">No active workspace</h1>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("changelogs")
    .select("id, title, content, published_at, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const list = entries ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">/changelog</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Changelog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish release notes to your public timeline.
          </p>
        </div>
        <Link href="/dashboard/changelog/new">
          <Button size="sm">
            <Plus />
            New release
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <p className="mb-1.5 font-mono text-xs text-muted-foreground">
          public changelog link
        </p>
        <ShareLink
          url={`/public/${workspace.slug}/changelog`}
          label={`${workspace.name} changelog`}
        />
      </div>

      <PlanBanner page="changelog" />


      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Sparkles className="mb-3 size-5 text-muted-foreground" />

          <h3 className="text-sm font-medium">No releases yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Write your first release note, or generate one with AI from your
            recently completed feedback.
          </p>
          <Link href="/dashboard/changelog/new" className="mt-4">
            <Button size="sm">
              <Plus />
              New release
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {list.map((entry) => {
            const published = !!entry.published_at;
            return (
              <li key={entry.id}>
                <Link
                  href={`/dashboard/changelog/${entry.id}`}
                  className="flex items-center justify-between gap-4 bg-card p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium">
                        {entry.title}
                      </h3>
                      <Badge
                        variant={published ? "default" : "secondary"}
                        className="shrink-0 font-mono text-[10px]"
                      >
                        {published ? "published" : "draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {published
                        ? new Date(entry.published_at!).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : `created ${new Date(
                            entry.created_at
                          ).toLocaleDateString()}`}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
