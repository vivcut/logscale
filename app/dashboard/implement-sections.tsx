import Link from "next/link";
import { ArrowUp, Sparkles } from "@/components/icons";

import { cn } from "@/lib/utils";

export type ImplementItem = {
  id: string;
  title: string;
  upvotes_count: number;
  boardSlug: string | null;
  summary: string | null;
};

export type ImplementSection = {
  key: string;
  label: string;
  dot: string;
  items: ImplementItem[];
};

/**
 * "What to build next" overview — groups the most-upvoted posts by status
 * (under review → planned → in progress) so the team can prioritise. Each item
 * carries a short AI-generated gist of what the requester wants.
 */
export function ImplementSections({
  workspaceSlug,
  sections,
}: {
  workspaceSlug: string;
  sections: ImplementSection[];
}) {
  const hasAny = sections.some((s) => s.items.length > 0);
  if (!hasAny) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-3.5 text-muted-foreground" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          what to build next
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.key}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className={cn("size-1.5 rounded-full", section.dot)} />
              <h3 className="text-sm font-medium">{section.label}</h3>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {section.items.length}
              </span>
            </div>

            {section.items.length === 0 ? (
              <p className="px-4 py-6 text-center font-mono text-[11px] text-muted-foreground">
                nothing here
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {section.items.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex w-9 shrink-0 flex-col items-center rounded-md border border-border py-1 text-muted-foreground">
                        <ArrowUp className="size-3" />
                        <span className="font-mono text-[11px] tabular-nums">
                          {item.upvotes_count}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        {item.boardSlug ? (
                          <Link
                            href={`/public/${workspaceSlug}/${item.boardSlug}/${item.id}`}
                            target="_blank"
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="block truncate text-sm font-medium">
                            {item.title}
                          </span>
                        )}
                        {item.summary ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.summary}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
