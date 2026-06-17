"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "@/components/icons";

type Interval = "monthly" | "yearly";

/**
 * Two pricing cards for the Startup plan (monthly / yearly). Clicking a plan
 * posts to the checkout route and redirects to Stripe Checkout.
 */
export function CheckoutButtons() {
  const [loading, setLoading] = React.useState<Interval | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const startCheckout = async (interval: Interval) => {
    setError(null);
    setLoading(interval);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          title="Startup plan"
          price="$14"
          cadence="/ month"
          note="Billed monthly"
          loading={loading === "monthly"}
          disabled={loading !== null}
          onClick={() => startCheckout("monthly")}
        />
        <PlanCard
          title="Startup plan"
          price="$94"
          cadence="/ year"
          note="Billed yearly"
          highlight
          loading={loading === "yearly"}
          disabled={loading !== null}
          onClick={() => startCheckout("yearly")}
        />
      </div>
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

const FEATURES = [
  "Unlimited boards & posts",
  "Add images in changelogs and board posts",
  "Custom flairs in board posts",
  "Remove watermark",
];

function PlanCard({
  title,
  price,
  cadence,
  note,
  highlight = false,
  loading,
  disabled,
  onClick,
}: {
  title: string;
  price: string;
  cadence: string;
  note: string;
  highlight?: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={
        "flex flex-col rounded-xl border-2 bg-card p-6 " +
        (highlight ? "border-primary shadow-sm" : "border-border")
      }
    >
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        {highlight ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Best value
          </span>
        ) : null}
      </div>
      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">{cadence}</span>
      </div>
      <p className="mb-4 font-mono text-xs text-muted-foreground">{note}</p>

      <ul className="mb-6 space-y-2">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check weight="bold" className="size-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>

      {/* Localized Free Trial Banner */}
      <div className="mb-3 rounded-lg border-2 border-border-2 bg-secondary px-3 py-3 text-center text-md font-semibold text-foreground">
        14-day free trial included
      </div>

      <Button
        className="mt-auto w-full"
        variant={highlight ? "default" : "outline"}
        disabled={disabled}
        onClick={onClick}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          "Start free trial"
        )}
      </Button>
    </div>
  );
}