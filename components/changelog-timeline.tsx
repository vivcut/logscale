import { Sparkles } from "@/components/icons";

import { renderMarkdown } from "@/lib/markdown";

export type ChangelogEntry = {
 id: string;
 title: string;
 content: string;
 published_at: string;
};

function formatDate(iso: string) {
 return new Date(iso).toLocaleDateString(undefined, {
  year: "numeric",
  month: "long",
  day: "numeric",
 });
}

/**
 * Shared changelog timeline. Renders an identical vertical timeline on the
 * public changelog page and inside the embeddable widget so both stay in
 * lock-step. Pure/presentational — safe in any tree.
 */
export function ChangelogTimeline({ entries }: { entries: ChangelogEntry[] }) {
 if (entries.length === 0) {
  return (
   <div className="flex flex-col items-center justify-center rounded-md  border border-border border-dashed py-16 text-center">
    <Sparkles className="mb-3 size-5 text-muted-foreground" />
    <h3 className="text-sm font-medium">No updates yet</h3>
    <p className="mt-1 text-sm text-muted-foreground">
     Check back soon for product news.
    </p>
   </div>
  );
 }

 return (
  <ol className="relative border-l border-border">
   {entries.map((entry) => (
    <li key={entry.id} className="relative pb-14 pl-8 last:pb-0">
     {/* Node dot sitting on the timeline */}
     <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full  border border-border bg-background ring-4 ring-background" />

     {/* Date meta chip */}
     <time className="mb-3 inline-block font-mono text-xs uppercase tracking-wide text-muted-foreground">
      {formatDate(entry.published_at)}
     </time>

     <article className="rounded-md  border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">
       {entry.title}
      </h2>
      <div
       className="prose-changelog"
       dangerouslySetInnerHTML={{
        __html: renderMarkdown(entry.content),
       }}
      />
     </article>
    </li>
   ))}
  </ol>
 );
}
