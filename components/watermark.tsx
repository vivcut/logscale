import { getWorkspaceSubscription, hasStartupPlan } from "@/lib/subscription";

/**
 * "Built with LogScale" watermark shown on public pages and the widget for
 * workspaces on the Hobby (free) plan. Renders nothing on the Startup plan.
 *
 * Pass the workspace id; this resolves the plan server-side.
 */
export async function Watermark({
  workspaceId,
  className = "",
}: {
  workspaceId: string;
  className?: string;
}) {
  const subscription = await getWorkspaceSubscription(workspaceId);
  if (hasStartupPlan(subscription)) return null;

  return (
    <div
      className={
        "flex items-center justify-center py-6 text-center " + className
      }
    >
      <a
        href="https://LogScale.dev"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {/* <span aria-hidden>🚀</span> */}
        Built with{" "}
        <span className="font-mono font-medium text-foreground">LogScale</span>
      </a>
    </div>
  );
}
