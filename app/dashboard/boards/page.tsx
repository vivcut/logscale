import Link from "next/link";
import {
  ExternalLink,
  GitBranch,
  Lock,
  MessageSquare,
  Settings2,
  Sparkles,
  Clock,
  Eye,
} from "@/components/icons";




import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { CreateBoardForm } from "./create-board-form";
import { DeleteBoardButton } from "./delete-board-button";
import {
  OverviewBoards,
  type OverviewBoard,
  type OverviewPost,
} from "../overview-boards";
import {
  ImplementSections,
  type ImplementSection,
} from "../implement-sections";
import { buildImplementSections } from "../implement-data";
import { ImportantFeaturesReport } from "./important-features-report";
import { PlanBanner } from "@/components/plan-banner";



export const metadata = {
  title: "Boards — Pittstop",
};

type Board = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
};

export default async function BoardsPage() {
  const workspace = await getActiveWorkspace();

  if (!workspace) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="rounded-md  border border-border border-dashed  p-10 text-center">
          <h1 className="text-sm font-medium">No active workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a workspace to start managing feedback boards.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Strictly scope boards to the active workspace.
  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, slug, description, is_private, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const list = (boards ?? []) as Board[];
  const boardIds = list.map((b) => b.id);

  // ---- Aggregate post stats + recent feedback across all boards ----
  let waitingReview = 0;
  let planning = 0;
  let inProgress = 0;
  let shipped = 0;
  let recent: OverviewPost[] = [];
  let implementSections: ImplementSection[] = [];
  const overviewBoards: OverviewBoard[] = list.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));
  const boardsForImplement = list.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
  }));


  if (boardIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select(
        "id, title, description, status, upvotes_count, flair, board_id, created_at"
      )
      .in("board_id", boardIds)
      .order("upvotes_count", { ascending: false })
      .order("created_at", { ascending: false });

    const postList = (posts ?? []) as OverviewPost[];

    // Comment counts per post (shown on each row's meta line).
    const postIds = postList.map((p) => p.id);
    const commentCounts: Record<string, number> = {};
    if (postIds.length > 0) {
      const { data: comments } = await supabase
        .from("comments")
        .select("post_id")
        .in("post_id", postIds);
      for (const c of comments ?? []) {
        commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
      }
    }

    recent = postList.map((p) => ({
      ...p,
      comments_count: commentCounts[p.id] ?? 0,
    }));

    waitingReview = postList.filter((p) => p.status === "under-review").length;
    planning = postList.filter((p) => p.status === "planned").length;
    inProgress = postList.filter((p) => p.status === "in-progress").length;
    shipped = postList.filter((p) => p.status === "completed").length;

    implementSections = buildImplementSections(
      postList.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        upvotes_count: p.upvotes_count,
        comments_count: commentCounts[p.id] ?? 0,
        board_id: p.board_id,
      })),
      boardsForImplement
    );

  }

  const stats = [
    { label: "Waiting for review", value: waitingReview, icon: Clock },
    { label: "Planning", value: planning, icon: MessageSquare },
    { label: "In Progress", value: inProgress, icon: GitBranch },
    { label: "Shipped", value: shipped, icon: Sparkles },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          {/* <p className="font-mono text-xs text-muted-foreground">/boards</p> */}
          <h1 className="mt-1 text-4xl font-semibold">
            Feedback boards
          </h1>
          <p className="mt-3 text-md font-semibold text-muted-foreground">
            Organize feature requests into focused boards for{" "}
            <span className="font-mono text-foreground">{workspace.name}</span>.
          </p>
        </div>
        <CreateBoardForm />
      </div>

      <PlanBanner page="boards" />

      {list.length === 0 ? (

        <div className="flex flex-col items-center justify-center rounded-md  border border-border border-dashed  py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-md  border border-border  bg-secondary">
            <MessageSquare className="size-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-sm font-medium">No boards yet</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first board to start collecting feedback from your
            users.
          </p>
        </div>
      ) : (
        <>
          {/* ---- Post stats across all boards ---- */}
          <div className="mb-8 grid grid-cols-2 gap-[2px] overflow-hidden rounded-md bg-background lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-md  text-muted-foreground">
                    {s.label}
                  </span>
                  <s.icon weight="bold" className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-5xl font-semibold tabular-nums tracking-tight">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ---- Most important features (AI) ---- */}
          <ImportantFeaturesReport />

          {/* ---- What to build next ---- */}
          <div className="mb-2">
            <ImplementSections
              workspaceSlug={workspace.slug}
              sections={implementSections}
            />
          </div>


          {/* ---- Board cards ---- */}
          <h2 className="mb-3 text-md uppercase tracking-wider text-muted-foreground">
            your boards
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {list.map((board) => (
    <div
      key={board.id}
      className="group flex flex-col gap-3 rounded-md bg-card p-5 transition-colors hover:bg-popover"
    >
      <div className="flex items-start justify-between gap-2">
        {/* <div className="flex size-9 items-center justify-center rounded-md  border border-border  bg-popover text-foreground"> */}
          <MessageSquare weight="fill" className="size-8" />
        {/* </div> */}
        {board.is_private ? (
          <Badge
            variant="default"
            className="font-mono text-background"
          >
            <Lock weight="fill" className="size-4" />
            Private
          </Badge>
        ) : (
          <Badge
            variant="default"
            className="font-mono text-background"
          >
            <Eye weight="fill" className="size-4" />
            Public
          </Badge>
        )}
      </div>

      <Link
        href={`/dashboard/boards/${board.slug}`}
        className="flex-1"
      >
        <h3 className="text-2xl font-semibold transition-colors group-hover:text-foreground">
          {board.name}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {/* /board/{board.slug} */}
        </p>
        {board.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {board.description}
          </p>
        ) : null}
      </Link>

      <div className="flex items-center justify-between gap-3 pt-3">
        <Link
          href={`/dashboard/boards/${board.slug}`}
          className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings2 weight="bold" className="size-4" />
          Edit
        </Link>
        <Link
          href={`/public/${workspace.slug}/${board.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink weight="bold" className="size-4" />
          Public
        </Link>
        <DeleteBoardButton boardSlug={board.slug} />
      </div>
    </div>
  ))}
</div>

          {/* ---- Recent feedback (with board + timeframe filters) ---- */}
          {recent.length > 0 ? (
            <OverviewBoards
              workspaceSlug={workspace.slug}
              boards={overviewBoards}
              posts={recent}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
