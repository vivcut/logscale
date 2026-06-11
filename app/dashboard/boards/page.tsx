import Link from "next/link";
import { ExternalLink, Lock, MessageSquare, Settings2 } from "@/components/icons";


import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import { CreateBoardForm } from "./create-board-form";

export const metadata = {
  title: "Boards — ToTheMoon",
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
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
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

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">/boards</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Feedback boards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize feature requests into focused boards for{" "}
            <span className="font-mono text-foreground">{workspace.name}</span>.
          </p>
        </div>
        <CreateBoardForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-secondary">
            <MessageSquare className="size-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-sm font-medium">No boards yet</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first board to start collecting feedback from your
            users.
          </p>
        </div>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {list.map((board) => (
            <div
              key={board.id}
              className="group flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-9 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                  <MessageSquare className="size-4" />
                </div>
                {board.is_private ? (
                  <Badge
                    variant="outline"
                    className="gap-1 font-mono text-muted-foreground"
                  >
                    <Lock className="size-3" />
                    private
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="font-mono text-muted-foreground"
                  >
                    public
                  </Badge>
                )}
              </div>

              <Link href={`/dashboard/boards/${board.slug}`} className="flex-1">
                <h3 className="text-sm font-semibold transition-colors group-hover:text-foreground">
                  {board.name}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  /board/{board.slug}
                </p>
                {board.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {board.description}
                  </p>
                ) : null}
              </Link>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <Link
                  href={`/dashboard/boards/${board.slug}`}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Settings2 className="size-3" />
                  manage
                </Link>
                <Link
                  href={`/public/${workspace.slug}/${board.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                  public
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
