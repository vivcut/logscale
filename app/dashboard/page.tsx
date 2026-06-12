import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  GitBranch,
  Mail,
  MessageSquare,
  Sparkles,
} from "@/components/icons";


import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const workspace = await getActiveWorkspace();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user!.id)
    .single();

  const firstName = (profile?.name ?? "there").split(" ")[0];

  // ---- Per-app summary stats (concise) ----
  // Boards / Roadmap (both derive from posts)
  let boardCount = 0;
  let postCount = 0;
  let planned = 0;
  let inProgress = 0;
  let shipped = 0;
  // Changelog
  let changelogCount = 0;
  let lastChangelog: string | null = null;
  // Surveys
  let surveyCount = 0;
  let publishedSurveys = 0;
  let surveyResponses = 0;
  // Status
  let siteCount = 0;
  let sitesUp = 0;
  // Contact
  let contactSubmissions = 0;

  if (workspace) {
    const [
      boardsRes,
      changelogRes,
      surveysRes,
      sitesRes,
      contactRes,
    ] = await Promise.all([
      supabase
        .from("boards")
        .select("id")
        .eq("workspace_id", workspace.id),
      supabase
        .from("changelogs")
        .select("id, published_at, created_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("surveys")
        .select("id, is_published")
        .eq("workspace_id", workspace.id),
      supabase
        .from("monitored_sites")
        .select("id, status")
        .eq("workspace_id", workspace.id),
      supabase
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
    ]);

    const boardIds = (boardsRes.data ?? []).map((b) => b.id);
    boardCount = boardIds.length;

    if (boardIds.length > 0) {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, status")
        .in("board_id", boardIds);
      const list = posts ?? [];
      postCount = list.length;
      planned = list.filter((p) => p.status === "planned").length;
      inProgress = list.filter((p) => p.status === "in-progress").length;
      shipped = list.filter((p) => p.status === "completed").length;
    }

    const changelogs = changelogRes.data ?? [];
    changelogCount = changelogs.length;
    lastChangelog = changelogs[0]?.created_at ?? null;

    const surveys = surveysRes.data ?? [];
    surveyCount = surveys.length;
    publishedSurveys = surveys.filter((s) => s.is_published).length;
    if (surveys.length > 0) {
      const { count } = await supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true })
        .in(
          "survey_id",
          surveys.map((s) => s.id)
        );
      surveyResponses = count ?? 0;
    }

    const sites = sitesRes.data ?? [];
    siteCount = sites.length;
    sitesUp = sites.filter((s) => s.status === "UP").length;

    contactSubmissions = contactRes.count ?? 0;
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  // Concise app cards — each links to the full surface.
  const apps = [
    {
      href: "/dashboard/boards",
      label: "Boards",
      icon: MessageSquare,
      stats: [
        { k: "boards", v: boardCount },
        { k: "posts", v: postCount },
      ],
    },
    {
      href: "/dashboard/roadmap",
      label: "Roadmap",
      icon: GitBranch,
      stats: [
        { k: "planned", v: planned },
        { k: "in progress", v: inProgress },
        { k: "shipped", v: shipped },
      ],
    },
    {
      href: "/dashboard/changelog",
      label: "Changelog",
      icon: Sparkles,
      stats: [
        { k: "entries", v: changelogCount },
        { k: "latest", v: fmtDate(lastChangelog) },
      ],
    },
    {
      href: "/dashboard/surveys",
      label: "Surveys",
      icon: ClipboardList,
      stats: [
        { k: "published", v: `${publishedSurveys}/${surveyCount}` },
        { k: "responses", v: surveyResponses },
      ],
    },
    {
      href: "/dashboard/status",
      label: "Status",
      icon: Activity,
      stats: [
        { k: "sites up", v: `${sitesUp}/${siteCount}` },
      ],
    },
    {
      href: "/dashboard/contact-page",
      label: "Contact",
      icon: Mail,
      stats: [{ k: "submissions", v: contactSubmissions }],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground">/overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A quick snapshot of every surface in your workspace.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="group flex flex-col gap-4 bg-card p-5 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md border border-border bg-secondary">
                  <app.icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{app.label}</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {app.stats.map((s) => (
                <div key={s.k}>
                  <p className="text-xl font-semibold tabular-nums tracking-tight">
                    {s.v}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.k}
                  </p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
