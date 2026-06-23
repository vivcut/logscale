import { Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
 return (
  <main className="mx-auto max-w-7xl px-6 py-8">
   {/* Back link skeleton */}
   <Skeleton className="mb-6 h-3 w-28" />

   <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
    {/* Main column */}
    <div>
     <div className="flex gap-4">
      {/* Upvote skeleton */}
      <Skeleton className="h-16 w-14 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1 space-y-3">
       {/* Status + meta */}
       <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
       </div>
       {/* Title */}
       <Skeleton className="h-7 w-4/5" />
       {/* Description */}
       <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
       </div>
      </div>
     </div>

     {/* Comments section */}
     <div className="mt-10 space-y-4">
      <div className="flex items-center gap-2">
       <Skeleton className="h-4 w-20" />
       <Skeleton className="h-3 w-6" />
      </div>

      {/* Comment skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
       <div
        key={i}
        className="rounded-xl border-2 border-border bg-card px-3.5 py-2.5 space-y-2"
       >
        <div className="flex items-center gap-2">
         <Skeleton className="size-5 rounded-full" />
         <Skeleton className="h-3 w-20" />
         <Skeleton className="h-2 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
       </div>
      ))}

      {/* Reply skeletons nested */}
      <div className="ml-7 space-y-2">
       {Array.from({ length: 2 }).map((_, i) => (
        <div
         key={i}
         className="rounded-xl border-2 border-border bg-card px-3.5 py-2.5 space-y-2"
        >
         <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2 w-12" />
         </div>
         <Skeleton className="h-3 w-4/5" />
        </div>
       ))}
      </div>

      {/* Comment form skeleton */}
      <div className="mt-4 space-y-2">
       <Skeleton className="h-20 w-full rounded-xl" />
       <div className="flex justify-between">
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-xl" />
       </div>
      </div>
     </div>
    </div>

    {/* Sidebar — Activity timeline skeleton */}
    <aside className="lg:sticky lg:top-8 lg:self-start">
     <div className="rounded-xl border-2 border-border bg-card p-5 space-y-4">
      <Skeleton className="h-3 w-16" />
      <div className="relative space-y-4 border-l pl-4">
       {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative space-y-1">
         <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-muted" />
         <Skeleton className="h-3 w-32" />
         <Skeleton className="h-2 w-24" />
        </div>
       ))}
      </div>
     </div>
    </aside>
   </div>
  </main>
 );
}
