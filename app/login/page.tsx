
import Link from "next/link";
import type { Metadata } from "next";
import { Avocado } from "@/components/icons";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
 title: "Sign in — Pittstop",
 description: "Sign in to your Pittstop workspace.",
};

export default function LoginPage() {
 return (
  <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
   {/* Subtle radial glow backdrop */}
   <div
    aria-hidden
    // className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_0%,oklch(0.2_0_0)_0%,transparent_70%)]"
   />

   <div className="relative z-10 w-full max-w-sm">
    {/* Brand */}
    <Link
     href="/"
     className="mb-8 flex items-center justify-center gap-2"
    >
     <div className={"flex items-center gap-1 justify-center"}>
     <Avocado weight="fill" className="size-6 text-primary" />
     <h1 className={`text-2xl font-bold`}>Pittstop</h1>
    </div>
    </Link>

    {/* Card */}

     <LoginForm />
   

    {/* Meta footer */}
    <p className="mt-6 text-center font-mono text-xs leading-relaxed text-muted-foreground">
     {/* By continuing you agree to our{" "} */}
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
