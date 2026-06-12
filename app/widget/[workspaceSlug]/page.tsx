import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getRoadmapPosts } from "@/lib/roadmap";
import { getWorkspaceStatus } from "@/lib/uptime";
import { getPublicSurvey, type SurveyQuestion } from "@/lib/surveys";
import { toContactConfig } from "@/lib/contact";
import {
  getWorkspaceSubscription,
  hasStartupPlan,
} from "@/lib/subscription";
import { WidgetShell, type WidgetBoardInfo } from "./widget-board";

import { type PublicPost } from "@/app/public/[workspaceSlug]/[boardSlug]/feedback-board";
import { type StatusSite } from "@/components/status-board";



type PageParams = { workspaceSlug: string };
type SearchParams = { view?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { workspaceSlug } = await params;
  return {
    title: `${workspaceSlug} — Feedback`,
    robots: { index: false },
  };
}

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { workspaceSlug } = await params;
  const { view: rawView } = await searchParams;
  const supabase = createAdminClient();

  // A view can target a single item via "board:slug" or "survey:slug". Split it
  // into the base surface + an optional target slug. Everything else (all,
  // board, roadmap, changelog, status) has no target.
  const [baseView, targetSlug] = (rawView ?? "all").split(":");
  const view = baseView || "all";


  const { data: workspace } = await supabase
    .from("workspaces")
    .select(
      "id, name, slug, widget_theme, changelog_enabled, boards_enabled, roadmap_enabled, status_enabled, contact_enabled, contact_title, contact_placeholder, contact_email_required, contact_sms_required"
    )
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) notFound();

  // Hobby (free) workspaces show the "Built with ToTheMoon" watermark in the
  // widget footer; the Startup plan removes it.
  const subscription = await getWorkspaceSubscription(workspace.id);
  const showWatermark = !hasStartupPlan(subscription);

  // Resolve the widget colour scheme chosen by the owner. "auto" defers to the

  // visitor's OS via prefers-color-scheme; "dark"/"light" force the scheme.
  // This runs before paint to avoid a flash of the wrong theme inside the frame.
  const widgetTheme = (workspace.widget_theme ?? "auto") as
    | "auto"
    | "dark"
    | "light";
  const themeScript =
    widgetTheme === "dark"
      ? `document.documentElement.classList.add("dark");`
      : widgetTheme === "light"
        ? `document.documentElement.classList.remove("dark");`
        : `document.documentElement.classList.toggle("dark",window.matchMedia("(prefers-color-scheme: dark)").matches);`;


  // Each surface only appears in the widget when its visibility toggle is on.
  const boardsEnabled = workspace.boards_enabled !== false;
  const roadmapEnabled = workspace.roadmap_enabled !== false;
  const statusEnabled = workspace.status_enabled !== false;

  // All public boards in the workspace — the widget lets the visitor switch
  // between them, mirroring the full public site. Skipped when boards are off.
  const { data: boardsRaw } = boardsEnabled
    ? await supabase
        .from("boards")
        .select("id, name, slug, description, flairs")
        .eq("workspace_id", workspace.id)
        .eq("is_private", false)
        .order("created_at", { ascending: true })
    : { data: [] };


  let boards = (boardsRaw ?? []).map((b) => ({
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    description: (b.description ?? null) as string | null,
    flairs: (b.flairs ?? ["feedback", "bug"]) as string[],
  })) as WidgetBoardInfo[];

  // "board:slug" pins the widget to a single board (no board switcher).
  if (view === "board" && targetSlug) {
    boards = boards.filter((b) => b.slug === targetSlug);
  }


  const boardIds = boards.map((b) => b.id);

  // Posts across every public board, grouped client-side by board_id.
  const postsByBoard: Record<string, PublicPost[]> = {};
  for (const b of boards) postsByBoard[b.id] = [];

  if (boardIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select(
        "id, board_id, title, description, status, upvotes_count, flair, created_at"
      )
      .in("board_id", boardIds)
      .order("upvotes_count", { ascending: false })
      .order("created_at", { ascending: false });

    for (const p of (posts ?? []) as (PublicPost & { board_id: string })[]) {
      (postsByBoard[p.board_id] ??= []).push(p);
    }
  }

  // Roadmap (planned / in-progress / completed) across the workspace.
  const roadmap = roadmapEnabled ? await getRoadmapPosts(workspace.id) : [];

  // Uptime status + change-log history for the workspace's monitored services.
  const statusSites: StatusSite[] = statusEnabled
    ? (await (async () => {
        const { sites, eventsBySite, incidentsBySite } =
          await getWorkspaceStatus(workspace.id);
        return sites.map((s) => ({
          ...s,
          events: eventsBySite[s.id] ?? [],
          incidents: incidentsBySite[s.id] ?? [],
        }));
      })())
    : [];




  // Recent published changelog entries (only when the changelog is enabled).
  const changelogEnabled = workspace.changelog_enabled !== false;
  const { data: changelogs } = changelogEnabled
    ? await supabase
        .from("changelogs")
        .select("id, title, content, published_at")
        .eq("workspace_id", workspace.id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(20)
    : { data: [] };

  // "survey:slug" pins the widget to a single published survey, rendered as an
  // embedded form. getPublicSurvey already enforces the surveys visibility
  // toggle + published state (returns null otherwise).
  let survey:
    | {
        id: string;
        title: string;
        description: string | null;
        requireEmail: boolean;
        questions: SurveyQuestion[];
      }
    | null = null;

  if (view === "survey" && targetSlug) {
    const data = await getPublicSurvey(workspace.slug, targetSlug);
    if (data) {
      survey = {
        id: data.survey.id,
        title: data.survey.title,
        description: data.survey.description,
        requireEmail: data.survey.require_email,
        questions: data.questions,
      };
    }
  }

  // Contact form — appears as a tab in "all" or stands alone in "contact". Only
  // surfaced when the workspace owner has the contact page enabled.
  const contactConfig = toContactConfig(workspace);
  const contact = contactConfig.enabled
    ? {
        workspaceId: workspace.id,
        title: contactConfig.title,
        placeholder: contactConfig.placeholder,
        emailRequired: contactConfig.emailRequired,
        smsRequired: contactConfig.smsRequired,
      }
    : null;

  return (
    <>
      {/* Apply the owner's chosen widget theme before paint. */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <WidgetShell
      workspaceName={workspace.name}

      workspaceSlug={workspace.slug}
      view={view ?? "all"}
      changelogEnabled={changelogEnabled}
      boardsEnabled={boardsEnabled}
      roadmapEnabled={roadmapEnabled}
      boards={boards}

      postsByBoard={postsByBoard}
      roadmap={roadmap}
      statusSites={statusSites}
      survey={survey}
      contact={contact}
      showWatermark={showWatermark}

      changelogs={

        (changelogs ?? []) as {
          id: string;
          title: string;
          content: string;
          published_at: string;
        }[]
      }
      />
    </>
  );
}


