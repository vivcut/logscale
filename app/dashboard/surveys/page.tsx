import Link from "next/link";
import { ClipboardList } from "@/components/icons";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { CreateSurveyForm } from "./create-survey-form";
import { PlanBanner } from "@/components/plan-banner";


export const metadata = {
  title: "Surveys — ToTheMoon",
};

export default async function SurveysPage() {
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

  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, title, description, slug, is_published, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const list = surveys ?? [];

  // Response counts per survey (one round-trip, grouped client-side).
  const ids = list.map((s) => s.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: responses } = await supabase
      .from("survey_responses")
      .select("survey_id")
      .in("survey_id", ids);
    for (const r of responses ?? []) {
      counts.set(r.survey_id, (counts.get(r.survey_id) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* Header with workspace identity */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary text-sm font-medium">
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
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {workspace.name} / surveys
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
              Surveys
            </h1>
          </div>
        </div>
      </div>

      <PlanBanner page="surveys" />

      {/* Create */}
      <div className="mb-8 rounded-xl border border-border bg-card p-4">

        <p className="mb-3 text-sm text-muted-foreground">
          Build a form with custom questions, publish it, and share the public
          link to collect responses.
        </p>
        <CreateSurveyForm />
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="mb-3 size-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">No surveys yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first form above to start gathering structured feedback.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {list.map((s) => {
            const n = counts.get(s.id) ?? 0;
            return (
              <li key={s.id}>
                <Link
                  href={`/dashboard/surveys/${s.id}`}
                  className="flex items-center justify-between gap-4 bg-card p-4 transition-colors hover:bg-secondary/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium">
                        {s.title}
                      </h3>
                      <Badge
                        variant={s.is_published ? "default" : "secondary"}
                        className="shrink-0 font-mono text-[10px]"
                      >
                        {s.is_published ? "published" : "draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {n} {n === 1 ? "response" : "responses"} · created{" "}
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    edit →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
