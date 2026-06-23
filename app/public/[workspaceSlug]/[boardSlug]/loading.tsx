import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
 return (
  <main className="mx-auto max-w-7xl px-6 py-8">
   {/* Board header skeleton */}
   <div className="mb-6 flex items-center justify-between">
    <div className="space-y-2">
     <Skeleton className="h-7 w-48" />
     <Skeleton className="h-3 w-64" />
    </div>
    <Skeleton className="h-9 w-28 rounded-xl" />
   </div>

   {/* Filter bar skeleton */}
   <div className="mb-6 flex items-center gap-2">
    <Skeleton className="h-8 w-20 rounded-lg" />
    <Skeleton className="h-8 w-20 rounded-lg" />
    <Skeleton className="h-8 w-20 rounded-lg" />
    <Skeleton className="h-8 w-20 rounded-lg" />
   </div>

   {/* Post list skeleton */}
   <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
     <div
      key={i}
      className="flex gap-4 rounded-xl border-2 border-border bg-card p-4"
     >
      {/* Upvote button skeleton */}
      <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
      {/* Content */}
      <div className="flex-1 space-y-2">
       <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
       </div>
       <Skeleton className="h-5 w-3/4" />
       <Skeleton className="h-3 w-full" />
       <div className="flex items-center gap-3 pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
       </div>
      </div>
     </div>
    ))}
   </div>
  </main>
 );
}
