
import Link from "next/link";
import type { Metadata } from "next";
import { FlagBanner } from "@/components/icons";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
 title: "Sign in — Pittstop",
 description: "Sign in to your Pittstop workspace.",
};

export default async function LoginPage({
 searchParams,
}: {
 searchParams: Promise<{ brand?: string; next?: string }>;
}) {
 const params = await searchParams;
 const brandName = params.brand || null;

 return (
  <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
   {/* Subtle radial glow backdrop */}
   <div
    aria-hidden
    // className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_0%,oklch(0.2_0_0)_0%,transparent_70%)]"
   />

   <div className="relative z-10 w-full max-w-sm">
    {/* Brand */}
    <div className="mb-8 flex items-center justify-center gap-2">
     {brandName ? (
      <h1 className="text-2xl font-bold">{brandName}</h1>
     ) : (
      <Link href="/" className="flex items-center gap-1 justify-center">
       <FlagBanner weight="fill" className="size-6 text-primary" />
       <h1 className={`text-2xl font-bold`}>Pittstop</h1>
      </Link>
     )}
    </div>

    {/* Sign in heading */}
    <p className="mb-6 text-center text-sm text-muted-foreground">
     {brandName ? `Sign in to ${brandName}` : "Sign in to your account"}
    </p>

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
