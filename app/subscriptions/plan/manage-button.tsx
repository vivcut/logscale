"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "@/components/icons";

/**
 * Opens the Stripe Billing Portal for the active workspace so the customer can
 * update their card, view invoices, or cancel the Startup plan.
 */
export function ManageSubscriptionButton() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openPortal = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not open billing portal.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={openPortal} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Opening…
          </>
        ) : (
          <>
            <ExternalLink className="size-4" />
            Manage subscription
          </>
        )}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
