import { Skeleton } from "@/components/ui/skeleton";

export default function ChangelogLoading() {
 return (
  <main className="mx-auto max-w-3xl px-6 py-8">
   <ol className="relative border-l border-border">
    {Array.from({ length: 3 }).map((_, i) => (
     <li key={i} className="relative pb-14 pl-8 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border border-border bg-background ring-4 ring-background" />
      <Skeleton className="h-3 w-28 mb-3" />
      <div className="rounded-md border border-border bg-card p-6 space-y-3">
       <Skeleton className="h-5 w-2/3" />
       <Skeleton className="h-3 w-full" />
       <Skeleton className="h-3 w-full" />
       <Skeleton className="h-3 w-4/5" />
       <Skeleton className="h-3 w-3/5" />
      </div>
     </li>
    ))}
   </ol>
  </main>
 );
}
