import Link from "next/link";

import { ArrowLeft, BadgeCheck, Rocket } from "@/components/icons";
import { getActiveWorkspace } from "@/lib/workspace";
import {
  getWorkspaceSubscription,
  hasStartupPlan,
} from "@/lib/subscription";

import { CheckoutButtons } from "./checkout-buttons";
import { ManageSubscriptionButton } from "./manage-button";


export const metadata = {
  title: "Plan — LogScale",
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
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
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
        <ArrowLeft className="size-3" />
        back to settings
      </Link>

      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground">
          /subscriptions/plan
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {hasPlan ? "Your plan" : "Upgrade your plan"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the subscription for{" "}
          <span className="font-medium text-foreground">{workspace.name}</span>.
          Plans are tied to this workspace only.
        </p>
      </div>

      {/* Stripe return banners */}
      {success ? (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Payment received — your Startup plan is now active.
        </div>
      ) : null}
      {canceled ? (
        <div className="mb-6 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
          Checkout canceled. You haven&apos;t been charged.
        </div>
      ) : null}

      {hasPlan ? (
        <div className="flex items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 p-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgeCheck className="size-6" />
          </div>
          <div>
            <p className="text-base font-semibold">You have Startup plan</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Thanks for subscribing. Everything in LogScale is unlocked for
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
