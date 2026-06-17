"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
 Activity,
 ClipboardList,
 GitBranch,
 LayoutGrid,
 Mail,
 MessageSquare,
 BadgeCheck,
 Monitor,
 Moon,
 Rocket,
 Settings,
 SidebarIcon,
 Sparkles,
 Sun,
 Menu, // Added for hamburger
 X,  // Added for closing drawer
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { AvocadoIcon } from "@phosphor-icons/react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const nav: NavItem[] = [
 { href: "/dashboard", label: "Overview", icon: LayoutGrid },
 { href: "/dashboard/boards", label: "Boards", icon: MessageSquare },
 { href: "/dashboard/roadmap", label: "Roadmap", icon: GitBranch },
 { href: "/dashboard/changelog", label: "Changelog", icon: Sparkles },
 { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type Workspace = {
 id: string;
 name: string;
 slug: string;
 logo_url: string | null;
 shared: boolean;
};

export function DashboardSidebar({
 workspaces,
 activeWorkspaceId,
 displayName,
 displayEmail,
 avatarUrl,
 isStartup = false,
}: {
 workspaces: Workspace[];
 activeWorkspaceId?: string | null;
 displayName: string;
 displayEmail: string;
 avatarUrl: string | null;
 isStartup?: boolean;
}) {
 const pathname = usePathname();
 const [collapsed, setCollapsed] = React.useState(false);
 const [mobileOpen, setMobileOpen] = React.useState(false);

 // Close mobile sidebar automatically on navigation links clicks
 React.useEffect(() => {
  setMobileOpen(false);
 }, [pathname]);

 React.useEffect(() => {
  try {
   setCollapsed(localStorage.getItem("sidebar:collapsed") === "1");
  } catch {}
 }, []);

 const toggleCollapsed = () => {
  setCollapsed((c) => {
   const next = !c;
   try {
    localStorage.setItem("sidebar:collapsed", next ? "1" : "0");
   } catch {}
   return next;
  });
 };

 const isActive = (href: string) =>
  href === "/dashboard"
   ? pathname === "/dashboard"
   : pathname.startsWith(href);

 // Common inner render structure shared identically across desktop sidebar container and mobile slider drawer panel view
 const renderSidebarContent = (isMobileView = false) => {
  const isCollapsedLayout = !isMobileView && collapsed;

  return (
   <>
    <div
     className={cn(
      "flex h-14 items-center  shrink-0",
      isCollapsedLayout ? "justify-center px-2" : "gap-1 px-4"
     )}
    >
     {isCollapsedLayout ? (
      <button
       onClick={toggleCollapsed}
       title="Expand sidebar"
       aria-label="Expand sidebar"
       className="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
       <SidebarIcon weight="bold" className="size-5" />
      </button>
     ) : (
      <>
       <div className="min-w-0 flex-1">
        <WorkspaceSwitcher
         workspaces={workspaces}
         activeId={activeWorkspaceId}
        />
       </div>

       {!isMobileView && (
        <button
         onClick={toggleCollapsed}
         title="Collapse sidebar"
         aria-label="Collapse sidebar"
         className="flex size-7 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary hover:text-white"
        >
         <SidebarIcon weight="bold" className="size-5" />
        </button>
       )}

       {isMobileView && (
        <button
         onClick={() => setMobileOpen(false)}
         aria-label="Close menu"
         className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
         <X className="size-5" />
        </button>
       )}
      </>
     )}
    </div>

    <div className={"flex items-center gap-1 w-full px-3 justify-center"}>
     <AvocadoIcon weight="fill" className="size-6 text-primary" />
     <h1 className={`text-2xl font-bold ${isCollapsedLayout ? "hidden" : "block"}`}>Pitstop</h1>
    </div>

    {/* Plan badge */}
    <div className={cn("px-3 pt-3", isCollapsedLayout && "px-2")}>
     <Link
      href="/subscriptions/plan"
      title={isStartup ? "Startup plan" : "Hobby plan — upgrade"}
      className={cn(
       "flex items-center rounded-xl !py-3  border-2 border-border text-sm font-semibold transition-colors",
       isCollapsedLayout ? "justify-center px-2 py-2" : "gap-2 px-3 py-2",
       isStartup
        ? "bg-popover"
        : " bg-secondary/40 text-muted-foreground hover:text-foreground"
      )}
     >
      {isStartup ? (
       <BadgeCheck weight="fill" className="size-4 shrink-0" />
      ) : (
       <Rocket className="size-4 shrink-0" />
      )}
      {!isCollapsedLayout ? (
       <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate">
         {isStartup ? "Startup plan" : "Hobby plan"}
        </span>
        {!isStartup ? (
         <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-primary">
          upgrade
         </span>
        ) : null}
       </span>
      ) : null}
     </Link>
    </div>

    <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto">
     {!isCollapsedLayout ? (
      <span className="px-3 pb-2 pt-1 text-[12px] uppercase tracking-wider font-bold text-center text-muted-foreground">
       Workspace
      </span>
     ) : null}

     {nav.map((item) => (
      <Link
       key={item.href}
       href={item.href}
       title={isCollapsedLayout ? item.label : undefined}
       className={cn(
        "flex items-center rounded-xl text-md font-semibold transition-colors",
        isCollapsedLayout ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
        isActive(item.href)
         ? "bg-popover text-foreground"
         : "text-muted-foreground hover:bg-popover hover:text-foreground"
       )}
      >
       <item.icon className="size-5 shrink-0" />
       {!isCollapsedLayout ? item.label : null}
      </Link>
     ))}
    </nav>

    {/* Theme toggle */}
    <div className={cn("px-3 pb-1", isCollapsedLayout && "px-2")}>
     <ThemeToggle collapsed={isCollapsedLayout} />
    </div>

    {/* Account */}
    <div className={cn(" border-t-2 border-border p-3", isCollapsedLayout && "px-2")}>
     <Link
      href="/dashboard/profile"
      title={isCollapsedLayout ? displayName : "Edit your profile"}
      className={cn(
       "flex items-center rounded-xl transition-colors hover:bg-popover",
       isCollapsedLayout ? "justify-center py-2" : "gap-3 px-2 py-2",
       isActive("/dashboard/profile") && "bg-popover"
      )}
     >
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-xs font-medium">
       {avatarUrl ? (
        <img
         src={avatarUrl}
         alt={displayName}
         className="size-full object-cover"
        />
       ) : (
        displayName.charAt(0).toUpperCase()
       )}
      </div>
      {!isCollapsedLayout ? (
       <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate font-semibold text-xs text-muted-foreground">
         {displayEmail}
        </p>
       </div>
      ) : null}
     </Link>
    </div>
   </>
  );
 };

 return (
  <>
   {/* Mobile Top Header Display View */}
   <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between bg-card px-6 md:hidden">
    <div className={"flex items-center gap-1 justify-center"}>
     <AvocadoIcon weight="fill" className="size-6 text-primary" />
     <h1 className={`text-2xl font-bold`}>Pitstop</h1>
    </div>
    <button
     onClick={() => setMobileOpen(true)}
     aria-label="Open menu"
     className="flex size-11 items-center justify-center rounded-xl  border-2 border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
    >
     <Menu weight="bold" className="size-7" />
    </button>
   </header>

   {/* Spacer to push downstream content down past fixed top dynamic header inside viewport container on mobile screens */}
   <div className="h-14 w-full shrink-0 md:hidden" />

   {/* Mobile Sidebar Slider Sliding Backdrop Overlay Sheet Drawer */}
   {mobileOpen && (
    <div className="fixed inset-0 z-50 flex md:hidden">
     {/* Dimmed backdrop background blur masking */}
     <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
      onClick={() => setMobileOpen(false)}
     />
     {/* Menu core body layout wrapper block */}
     <aside className="relative flex w-64 max-w-xs flex-1 flex-col bg-card h-full border-r animate-in slide-in-from-left duration-200">
      {renderSidebarContent(true)}
     </aside>
    </div>
   )}

   {/* Desktop Main Side panel Component Frame */}
   <aside
    className={cn(
     "sticky hidden h-[calc(100vh-1rem)] translate-y-[0.5rem] shrink-0 flex-col overflow-hidden bg-card rounded-r-2xl transition-[width] duration-200 md:flex not-dark:shadow-md",
     collapsed ? "w-16" : "w-64"
    )}
   >
    {renderSidebarContent(false)}
   </aside>
  </>
 );
}

type Theme = "system" | "light" | "dark";

const THEMES: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] =
 [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
 ];

function applyTheme(theme: Theme) {
 const dark =
  theme === "dark" ||
  (theme !== "light" &&
   window.matchMedia("(prefers-color-scheme: dark)").matches);
 document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle({ collapsed }: { collapsed: boolean }) {
 const [theme, setTheme] = React.useState<Theme>("system");

 React.useEffect(() => {
  let stored: Theme = "system";
  try {
   stored = (localStorage.getItem("theme") as Theme) || "system";
  } catch {}
  setTheme(stored);

  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
   try {
    if ((localStorage.getItem("theme") || "system") === "system") {
     applyTheme("system");
    }
   } catch {}
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
 }, []);

 const pick = (next: Theme) => {
  setTheme(next);
  try {
   localStorage.setItem("theme", next);
  } catch {}
  applyTheme(next);
 };

 const order: Theme[] = ["system", "light", "dark"];
 const current = THEMES.find((t) => t.value === theme) ?? THEMES[0];
 const Icon = current.icon;

 const handleCycleTheme = () => {
  const nextTheme = order[(order.indexOf(theme) + 1) % order.length];
  pick(nextTheme);
 };

 if (collapsed) {
  return (
   <button
    onClick={handleCycleTheme}
    title={`Theme: ${current.label}`}
    aria-label={`Theme: ${current.label} (click to change)`}
    className="flex size-8 mx-auto items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
   >
    <Icon className="size-4" />
   </button>
  );
 }

 return (
  <button
   onClick={handleCycleTheme}
   title={`Theme: ${current.label}`}
   aria-label={`Theme: ${current.label} (click to change)`}
   className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground  border-2 border-border dark:border-popover transition-colors hover:bg-popover hover:text-foreground"
  >
   <div className="flex items-center gap-3">
    <Icon className="size-5 shrink-0" />
   </div>
   <span className="text-xs text-muted-foreground/70">
    {current.label}
   </span>
  </button>
 );
}