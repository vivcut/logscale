
import { getWorkspaceSubscription, hasStartupPlan } from "@/lib/subscription";
import { Avocado } from "@/components/icons"

/**
 * "Built with Pitstop" watermark shown on public pages and the widget for
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
    href="https://Pitstop.dev"
    target="_blank"
    rel="noreferrer"
    className="items-center gap-1.5 flex rounded-full  border-2 border-border bg-card px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
   >
    {/* <span aria-hidden>🚀</span> */}
    <span className="font-semibold text-lg w-40 !text-muted-foreground">Built with{" "}</span>
     <div className={"flex items-center gap-1 w-full justify-center"}>
     <Avocado weight="fill" className="size-6" />
     <h1 className={`text-2xl font-bold`}>Pitstop</h1>
    </div>
   </a>
  </div>
 );
}
