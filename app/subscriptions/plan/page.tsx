import Link from "next/link";

import { ArrowLeft, BadgeCheck, Rocket } from "@/components/icons";
import { getActiveWorkspace } from "@/lib/workspace";
import {
 getWorkspaceSubscription,
 hasStartupPlan,
} from "@/lib/subscription";

import { CheckoutButtons } from "./checkout-buttons";
import { ManageSubscriptionButton } from "./manage-button";
import { Button } from "@/components/ui/button";


export const metadata = {
 title: "Plan — Pittstop",
};

export default async function PlanPage({
 searchParams,
}: {
 searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
 const { success, canceled } = await searchParams;
 const workspace = await getActiveWorkspace();

 if (!workspace) {
  return (
   <div className="mx-auto w-full max-w-3xl px-6 py-10">
    <div className="rounded-xl  border-2 border-border border-dashed p-10 text-center">
     <h1 className="text-sm font-medium">No active workspace</h1>
    </div>
   </div>
  );
 }

 const subscription = await getWorkspaceSubscription(workspace.id);
 const hasPlan = hasStartupPlan(subscription);

 return (
  <div className="mx-auto w-full max-w-3xl px-6 py-10">
   <Link
    href="/dashboard/settings"
    className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
   >
    <Button>
     <ArrowLeft className="size-4" />
    Back
    </Button>
   </Link>

   <div className="mb-8">
    
    <h1 className="mt-1 text-3xl font-semibold tracking-tight">
     {hasPlan ? "Your plan" : "Upgrade your plan"}
    </h1>
    <p className="mt-3 text-sm text-muted-foreground">
     Manage the subscription for{" "}
     <span className="font-medium text-foreground">{workspace.name}</span>.
     Plans are tied to this workspace only.
    </p>
   </div>

   {/* Stripe return banners */}
   {success ? (
    <div className="mb-6 rounded-xl  border-2 border-border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
     Payment received — your Startup plan is now active.
    </div>
   ) : null}
   {canceled ? (
    <div className="mb-6 rounded-xl  border-2 border-border bg-red-400/20 px-4 py-3 text-sm text-red-400 font-semibold">
     Checkout canceled. You haven&apos;t been charged.
    </div>
   ) : null}

   {hasPlan ? (
    <div className="flex items-center gap-4 rounded-xl  border-2 border-border border-primary/40 bg-primary/5 p-6">
     <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <BadgeCheck className="size-6" />
     </div>
     <div>
      <p className="text-base font-semibold">You have Startup plan</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
       Thanks for subscribing. Everything in Pittstop is unlocked for
       this workspace.
      </p>
      <div className="mt-4">
       <ManageSubscriptionButton />
      </div>
     </div>
    </div>
   ) : (

    <>
     <div className="mb-5 flex items-center gap-2">
      <Rocket className="size-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold">Choose a billing cycle</h2>
     </div>
     <CheckoutButtons />
    </>
   )}
  </div>
 );
}
