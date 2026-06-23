"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

import { ArrowRight, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FlagBannerIcon } from "@phosphor-icons/react";

const NAV_LINKS = [
 { label: "Features", href: "#features" },
 { label: "Demo", href: "#demo" },
 { label: "Pricing", href: "#pricing" },
 { label: "FAQ", href: "#faq" },
 { label: "Blog", href: "/blogs" },
];

/**
 * Landing navbar — sticky, frosted, and reacts to scroll (gains a  border-2 border-border +
 * stronger blur once the hero scrolls away). Includes an animated mobile sheet.
 * Both CTAs route to /login, the single entry point for sign-in / sign-up.
 */
export function Navbar() {
 const [scrolled, setScrolled] = React.useState(false);
 const [open, setOpen] = React.useState(false);

 React.useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
 }, []);

 // Lock body scroll while the mobile menu is open.
 React.useEffect(() => {
  document.body.style.overflow = open ? "hidden" : "";
  return () => {
   document.body.style.overflow = "";
  };
 }, [open]);

 return (
  <header
   className={cn(
    "fixed inset-x-0 top-0 z-50 transition-all duration-300",
    scrolled
     ? "bg-black backdrop-blur-2xl"
     : " border-transparent bg-black"
   )}
  >
   <div className="mx-auto flex h-22 max-w-8xl items-center justify-between px-20">
    <Link href="/" className="flex items-center gap-2">
     {/* <Circle className="size-8" weight="fill" /> */}
     <div className={"flex items-center gap-1 w-full px-3 justify-center"}>
     <FlagBannerIcon weight="fill" className="size-8 text-primary" />
     <h1 className={`text-3xl text-white`}>Pittstop</h1>
    </div>
    </Link>

    <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
     {NAV_LINKS.map((l) => (
      <a
       key={l.href}
       href={l.href}
       className="relative transition-colors hover:text-foreground text-white text-lg"
      >
       {l.label}
      </a>
     ))}
    </nav>

    <div className="hidden items-center gap-2 md:flex">
     {/* <Button variant="ghost" size="sm" asChild>
      <Link href="/login">Sign in</Link>
     </Button> */}
     <Button className="h-12 w-40 text-lg" size="sm" asChild>
      <Link href="/login">
       Start
       {/* <ArrowRight /> */}
      </Link>
     </Button>
    </div>

    {/* Mobile trigger */}
    <button
     type="button"
     aria-label="Toggle menu"
     onClick={() => setOpen((v) => !v)}
     className="flex size-9 items-center justify-center rounded-xl  border-2 border-border text-foreground md:hidden"
    >
     {open ? (
      <X className="size-4" />
     ) : (
      <div className="flex flex-col gap-1">
       <span className="block h-0.5 w-4 bg-foreground" />
       <span className="block h-0.5 w-4 bg-foreground" />
      </div>
     )}
    </button>
   </div>

   {/* Mobile sheet */}
   <AnimatePresence>
    {open ? (
     <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="border-b-2 bg-background/95 backdrop-blur-xl md:hidden"
     >
      <nav className="mx-auto flex max-w-6xl flex-col px-6 py-4">
       {NAV_LINKS.map((l) => (
        <a
         key={l.href}
         href={l.href}
         onClick={() => setOpen(false)}
         className="border-b-2 border-border/60 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
         {l.label}
        </a>
       ))}
       <div className="mt-4 flex flex-col gap-2">
        <Button variant="outline" asChild>
         <Link href="/login" onClick={() => setOpen(false)}>
          Sign in
         </Link>
        </Button>
        <Button asChild>
         <Link href="/login" onClick={() => setOpen(false)}>
          Get started
          {/* <ArrowRight /> */}
         </Link>
        </Button>
       </div>
      </nav>
     </motion.div>
    ) : null}
   </AnimatePresence>
  </header>
 );
}
