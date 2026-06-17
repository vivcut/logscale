/**
 * Dashboard route loading state. The layout (sidebar) stays mounted; only this
 * inner content shows while the server component streams. Kept intentionally
 * subtle — a couple of soft skeleton blocks (heading + top row) rather than a
 * busy full-page placeholder — then the real content fades in over it.
 */
export default function DashboardLoading() {
 return (
  <div className="mx-auto w-full max-w-6xl px-6 py-8">
   {/* heading skeleton */}
   <div className="skeleton h-7 w-48" />
   <div className="skeleton mt-2 h-4 w-72 opacity-70" />

   {/* top row of cards */}
   <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div className="skeleton h-24 w-full" />
    <div className="skeleton h-24 w-full" />
    <div className="skeleton h-24 w-full" />
   </div>
  </div>
 );
}
