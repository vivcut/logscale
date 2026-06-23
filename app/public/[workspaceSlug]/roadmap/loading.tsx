import { Skeleton } from "@/components/ui/skeleton";

export default function RoadmapLoading() {
 return (
  <main className="mx-auto max-w-7xl px-6 py-8">
   {/* 3-column roadmap skeleton */}
   <div className="grid gap-6 md:grid-cols-3">
    {["Planned", "In Progress", "Completed"].map((label) => (
     <div key={label} className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
       <Skeleton className="h-2.5 w-2.5 rounded-full" />
       <Skeleton className="h-4 w-24" />
       <Skeleton className="h-4 w-6 ml-auto rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
       <div
        key={i}
        className="rounded-md border border-border bg-card p-4 space-y-2"
       >
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2 pt-2">
         <Skeleton className="h-5 w-12 rounded-lg" />
         <Skeleton className="h-3 w-16 ml-auto" />
        </div>
       </div>
      ))}
     </div>
    ))}
   </div>
  </main>
 );
}
