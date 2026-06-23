
import { getWorkspaceSubscription, hasStartupPlan } from "@/lib/subscription";
import { FlagBanner } from "@/components/icons"

/**
 * "Powered by Pittstop" watermark shown on public pages and the widget for
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
    href="https://pittstop.space"
    target="_blank"
    rel="noreferrer"
    className="items-center gap-3 flex rounded-full  border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
   >
    {/* <span className="font-semibold text-lg w-40 !text-muted-foreground">Powered by{" "}</span>
     
     */}
     <p className="text-xl w-full">Powered by</p>
     <div className={"flex items-center gap-1 w-full justify-center"}>
     <FlagBanner weight="fill" className="size-6" />
     <h1 className={`text-2xl`}>Pittstop</h1>
    </div>
   </a>
  </div>
 );
}
