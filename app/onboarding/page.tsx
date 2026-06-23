import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "../dashboard/sign-out-button";
import { OnboardingForm } from "./onboarding-form";
import Link from "next/link";

export const metadata = {
 title: "Create your workspace — Pittstop",
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


   <div className="relative z-10 w-full max-w-md">
    <Link href="/" className="flex items-center gap-2">
       <div className={"flex items-center gap-1.5 w-full px-3 justify-center"}>
     {/* <Logo weight="fill" className="size-9 text-primary" /> */}
     <h1 className={`text-4xl text-white `}>Pittstop</h1>
    </div>
      </Link>
     

    <div className="rounded-md  border border-border bg-card p-6">
     <div className="mb-6 space-y-1.5">
      
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
