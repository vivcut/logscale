import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Pitstop",
  description: "Sign in to your Pitstop workspace.",
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Subtle radial glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_0%,oklch(0.2_0_0)_0%,transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="font-mono text-xs font-bold">↑</span>
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight">
            Pitstop
          </span>
        </Link>

        {/* Card */}
        <div className="rounded-xl border-2 border-border-2 bg-card p-6 shadow-2xl shadow-black/40">
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your feedback boards & roadmap.
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Meta footer */}
        <p className="mt-6 text-center font-mono text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
          >
            Terms
          </Link>{" "}
          &{" "}
          <Link
            href="/privacy"
            className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
