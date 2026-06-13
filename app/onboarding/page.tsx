import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "../dashboard/sign-out-button";
import { OnboardingForm } from "./onboarding-form";

export const metadata = {
  title: "Create your workspace — LogScale",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // When `?new=1` is present the user is intentionally creating an *additional*
  // workspace from the switcher, so we skip the "already onboarded" redirect.
  const { new: creatingAnother } = await searchParams;

  if (!creatingAnother) {
    // First-time onboarding: if the user already belongs to a workspace, send
    // them straight to the app.
    const { count } = await supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    if ((count ?? 0) > 0) {
      redirect("/dashboard");
    }
  }


  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_0%,oklch(0.2_0_0)_0%,transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground">
            <span className="font-mono text-xs font-bold">↑</span>
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight">
            LogScale
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
          <div className="mb-6 space-y-1.5">
            <p className="font-mono text-xs text-muted-foreground">
              /onboarding
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              Create your workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              A workspace is where your boards, roadmap, and changelog live.
            </p>
          </div>

          <OnboardingForm />
        </div>

        <div className="mt-6 flex items-center justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
