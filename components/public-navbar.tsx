"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavUser = {
 name: string | null;
 email: string;
 avatarUrl: string | null;
 isAdmin: boolean;
};

export type NavWorkspace = {
 name: string;
 slug: string;
 logoUrl: string | null;
 boardsEnabled: boolean;
 roadmapEnabled: boolean;
 changelogEnabled: boolean;
 isStartup?: boolean;
};

export function PublicNavbar({
 workspace,
 user,
}: {
 workspace: NavWorkspace;
 user: NavUser | null;
}) {
 const pathname = usePathname();

 const navLinks: { label: string; href: string }[] = [];
 if (workspace.boardsEnabled)
  navLinks.push({ label: "Feedback", href: `/public/${workspace.slug}` });
 if (workspace.roadmapEnabled)
  navLinks.push({ label: "Roadmap", href: `/public/${workspace.slug}/roadmap` });
 if (workspace.changelogEnabled)
  navLinks.push({ label: "Changelog", href: `/public/${workspace.slug}/changelog` });

 return (
  <>
  <header className="sticky top-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl">
   <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
    {/* Left: Logo + Name */}
    <Link
     href={`/public/${workspace.slug}`}
     prefetch={true}
     className="flex items-center gap-2.5"
    >
     <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-xs font-bold text-primary-foreground">
      {workspace.logoUrl ? (
       // eslint-disable-next-line @next/next/no-img-element
       <img
        src={workspace.logoUrl}
        alt={workspace.name}
        className="size-full object-cover"
       />
      ) : (
       workspace.name.charAt(0).toUpperCase()
      )}
     </div>
     <span className="text-lg font-bold">{workspace.name}</span>
    </Link>

    {/* Center: Nav links */}
    <nav className="hidden items-center gap-1 md:flex">
     {navLinks.map((link) => {
      const isActive =
       link.label === "Feedback"
        ? pathname === `/public/${workspace.slug}` ||
         (pathname.startsWith(`/public/${workspace.slug}/`) &&
          !pathname.includes("/roadmap") &&
          !pathname.includes("/changelog") &&
          !pathname.includes("/status") &&
          !pathname.includes("/contact"))
        : pathname.startsWith(link.href);

       return (
        <Link
         key={link.href}
         href={link.href}
         prefetch={true}
         className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          isActive
           ? "bg-secondary text-foreground"
           : "text-muted-foreground hover:text-foreground"
         )}
        >
         {link.label}
        </Link>
       );
     })}
    </nav>

    {/* Right: User status */}
    {user ? (
     <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold uppercase text-muted-foreground">
       {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
         src={user.avatarUrl}
         alt={user.name ?? user.email}
         className="size-full object-cover"
        />
       ) : (
        (user.name ?? user.email).charAt(0)
       )}
      </div>
      <span className="hidden text-sm font-medium sm:inline">
       {user.name ?? user.email}
      </span>
       <SignOutLink brandName={workspace.name} redirectUrl={pathname} showWatermark={!workspace.isStartup} />
     </div>
    ) : (
     <SignInLink brandName={workspace.name} />
    )}
   </div>

   {/* Admin banner */}
   {user?.isAdmin && (
    <div className="border-t border-primary/20 bg-primary px-6 py-2 text-center text-sm font-medium text-white">
     Posting and commenting as a verified admin
    </div>
   )}
  </header>

  {/* Mobile bottom tab bar */}
  {navLinks.length > 0 && (
   <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-lg px-2 py-2.5 md:hidden">
    {navLinks.map((link) => {
     const isActive =
      link.label === "Feedback"
       ? pathname === `/public/${workspace.slug}` ||
        (pathname.startsWith(`/public/${workspace.slug}/`) &&
         !pathname.includes("/roadmap") &&
         !pathname.includes("/changelog") &&
         !pathname.includes("/status") &&
         !pathname.includes("/contact"))
       : pathname.startsWith(link.href);

      return (
       <Link
        key={link.href}
        href={link.href}
        prefetch={true}
        className={cn(
         "flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors",
         isActive
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        {link.label}
       </Link>
      );
    })}
   </nav>
  )}
  </>
 );
}

function SignInLink({ brandName }: { brandName?: string }) {
 const pathname = usePathname();
 const brandParam = brandName ? `&brand=${encodeURIComponent(brandName)}` : "";
 return (
  <Link
   href={`/login?next=${encodeURIComponent(pathname)}${brandParam}`}
   className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
  >
   Sign in / Sign up
  </Link>
 );
}

function SignOutLink({ brandName, redirectUrl, showWatermark }: { brandName?: string; redirectUrl?: string; showWatermark?: boolean }) {
 const pathname = usePathname();
 const next = redirectUrl || pathname;
 const brandParam = brandName ? `&brand=${encodeURIComponent(brandName)}` : "";
 const watermarkParam = showWatermark ? "&watermark=1" : "";
 return (
  <a
   href={`/auth/signout?next=${encodeURIComponent(next)}${brandParam}${watermarkParam}`}
   className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
  >
   Sign out
  </a>
 );
}
