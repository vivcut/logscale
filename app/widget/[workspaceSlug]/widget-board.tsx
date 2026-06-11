"use client";

import * as React from "react";
import {
  Activity,
  ChevronDown,
  ClipboardList,
  GitBranch,
  Mail,
  MessageSquare,
  Sparkles,
  X,
} from "@/components/icons";


import { cn } from "@/lib/utils";
import {
  FeedbackBoard,
  type PublicPost,
} from "@/app/public/[workspaceSlug]/[boardSlug]/feedback-board";
import { RoadmapBoard, type RoadmapItem } from "@/components/roadmap-board";
import {
  ChangelogTimeline,
  type ChangelogEntry,
} from "@/components/changelog-timeline";
import { StatusBoard, type StatusSite } from "@/components/status-board";
import { FormRunner } from "@/app/forms/[workspaceSlug]/[surveySlug]/form-runner";
import { ContactForm } from "@/components/contact-form";
import { type SurveyQuestion } from "@/lib/surveys";


export type WidgetBoardInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  flairs: string[];
};

export type WidgetSurvey = {
  id: string;
  title: string;
  description: string | null;
  requireEmail: boolean;
  questions: SurveyQuestion[];
};

export type WidgetContact = {
  workspaceId: string;
  title: string;
  placeholder: string;
  emailRequired: boolean;
  smsRequired: boolean;
};

type Tab =
  | "feedback"
  | "roadmap"
  | "changelog"
  | "status"
  | "survey"
  | "contact";



/**
 * The embeddable widget. It renders the SAME components used by the full public
 * site (FeedbackBoard, RoadmapBoard, ChangelogTimeline) so the in-app
 * experience is pixel-identical to the public pages — just inside a drawer.
 *
 * `view` selects which surfaces are exposed (configured per embed snippet):
 *   - "all"       → tabbed: board picker + roadmap + changelog
 *   - "board"     → only the feedback board (with board picker)
 *   - "roadmap"   → only the roadmap
 *   - "changelog" → only the changelog
 */
export function WidgetShell({
  workspaceName,
  workspaceSlug,
  view = "all",
  changelogEnabled,
  boardsEnabled = true,
  roadmapEnabled = true,
  boards,
  postsByBoard,
  roadmap,
  changelogs,
  statusSites = [],
  survey = null,
  contact = null,
}: {
  workspaceName: string;
  workspaceSlug: string;
  view?: string;
  changelogEnabled: boolean;
  boardsEnabled?: boolean;
  roadmapEnabled?: boolean;
  boards: WidgetBoardInfo[];
  postsByBoard: Record<string, PublicPost[]>;
  roadmap: RoadmapItem[];
  changelogs: ChangelogEntry[];
  statusSites?: StatusSite[];
  survey?: WidgetSurvey | null;
  contact?: WidgetContact | null;
}) {
  // Which tabs are available for this embed configuration. A surface only
  // appears when the workspace owner has it enabled (data is preserved either
  // way — toggling just shows/hides the tab).
  const tabs = React.useMemo<Tab[]>(() => {
    if (view === "board") return boardsEnabled ? ["feedback"] : [];
    if (view === "roadmap") return roadmapEnabled ? ["roadmap"] : [];
    if (view === "changelog") return changelogEnabled ? ["changelog"] : [];
    if (view === "status") return statusSites.length > 0 ? ["status"] : [];
    // "survey" pins the widget to a single embedded form (no other tabs).
    if (view === "survey") return survey ? ["survey"] : [];
    // "contact" pins the widget to the contact form (no other tabs).
    if (view === "contact") return contact ? ["contact"] : [];
    // "all" — show every enabled surface. Status only appears when at least
    // one service is being monitored.
    const all: Tab[] = [];
    if (boardsEnabled) all.push("feedback");
    if (roadmapEnabled) all.push("roadmap");
    if (changelogEnabled) all.push("changelog");
    if (statusSites.length > 0) all.push("status");
    if (contact) all.push("contact");
    return all;
  }, [
    view,
    boardsEnabled,
    roadmapEnabled,
    changelogEnabled,
    statusSites.length,
    survey,
    contact,
  ]);




  const [tab, setTab] = React.useState<Tab>(tabs[0] ?? "feedback");

  const [activeBoardId, setActiveBoardId] = React.useState<string | null>(
    boards[0]?.id ?? null
  );
  const [boardMenuOpen, setBoardMenuOpen] = React.useState(false);

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? null;
  const showTabs = tabs.length > 1;

  function close() {
    window.parent?.postMessage({ type: "ck:close" }, "*");
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
            {workspaceName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold">{workspaceName}</span>
        </div>
        <button
          onClick={close}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      {showTabs ? (
        <div className="flex items-center gap-1 border-b border-border p-2">
          {tabs.includes("feedback") ? (
            <TabButton
              active={tab === "feedback"}
              onClick={() => setTab("feedback")}
              icon={<MessageSquare className="size-3.5" />}
              label="Boards"
            />

          ) : null}
          {tabs.includes("roadmap") ? (
            <TabButton
              active={tab === "roadmap"}
              onClick={() => setTab("roadmap")}
              icon={<GitBranch className="size-3.5" />}
              label="Roadmap"
            />
          ) : null}
          {tabs.includes("changelog") ? (
            <TabButton
              active={tab === "changelog"}
              onClick={() => setTab("changelog")}
              icon={<Sparkles className="size-3.5" />}
              label="Changelog"
            />
          ) : null}
          {tabs.includes("status") ? (
            <TabButton
              active={tab === "status"}
              onClick={() => setTab("status")}
              icon={<Activity className="size-3.5" />}
              label="Status"
            />
          ) : null}
          {tabs.includes("survey") ? (
            <TabButton
              active={tab === "survey"}
              onClick={() => setTab("survey")}
              icon={<ClipboardList className="size-3.5" />}
              label="Survey"
            />
          ) : null}
          {tabs.includes("contact") ? (
            <TabButton
              active={tab === "contact"}
              onClick={() => setTab("contact")}
              icon={<Mail className="size-3.5" />}
              label="Contact"
            />
          ) : null}
        </div>
      ) : null}



      {/* Board selector (feedback tab only, when more than one board) */}
      {tab === "feedback" && boards.length > 1 ? (
        <div className="relative border-b border-border px-3 py-2">
          <button
            onClick={() => setBoardMenuOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
          >
            <span className="flex items-center gap-1.5 truncate">
              <MessageSquare className="size-3.5 text-muted-foreground" />
              {activeBoard?.name ?? "Select a board"}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {boardMenuOpen ? (
            <div className="absolute left-3 right-3 z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-xl">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setActiveBoardId(b.id);
                    setBoardMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary",
                    b.id === activeBoardId && "bg-secondary"
                  )}
                >
                  <span className="font-medium">{b.name}</span>
                  {b.description ? (
                    <span className="truncate text-[10px] text-muted-foreground">
                      {b.description}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Body — reuses the exact public components */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "feedback" ? (
          boards.length === 0 || !activeBoard ? (
            <p className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
              no boards yet
            </p>
          ) : (
            <FeedbackBoard
              key={activeBoard.id}
              boardId={activeBoard.id}
              workspaceSlug={workspaceSlug}
              boardSlug={activeBoard.slug}
              flairs={activeBoard.flairs}
              initialPosts={postsByBoard[activeBoard.id] ?? []}
            />
          )
        ) : tab === "roadmap" ? (
          <RoadmapBoard posts={roadmap} compact />
        ) : tab === "status" ? (
          <StatusBoard sites={statusSites} />
        ) : tab === "survey" ? (
          survey ? (
            <div>
              <h2 className="mb-1 text-base font-semibold tracking-tight">
                {survey.title}
              </h2>
              {survey.description ? (
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {survey.description}
                </p>
              ) : null}
              {/* Reuses the exact public form so submissions stay identical. */}
              <FormRunner
                surveyId={survey.id}
                questions={survey.questions}
                requireEmail={survey.requireEmail}
              />
            </div>
          ) : (
            <p className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
              survey unavailable
            </p>
          )
        ) : tab === "contact" ? (
          contact ? (
            <div>
              <h2 className="mb-4 text-base font-semibold tracking-tight">
                {contact.title}
              </h2>
              {/* Reuses the exact public contact form so submissions match. */}
              <ContactForm
                workspaceId={contact.workspaceId}
                placeholder={contact.placeholder}
                emailRequired={contact.emailRequired}
                smsRequired={contact.smsRequired}
              />
            </div>
          ) : (
            <p className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
              contact unavailable
            </p>
          )
        ) : (
          <ChangelogTimeline entries={changelogs} />
        )}


      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
