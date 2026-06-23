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
 Rocket,
 Settings,
 SidebarIcon,
 Sparkles,
 Menu,
 X,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { FlagBannerIcon } from "@phosphor-icons/react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const nav: NavItem[] = [
 { href: "/dashboard", label: "Overview", icon: LayoutGrid },
 { href: "/dashboard/boards", label: "Boards", icon: MessageSquare },
 { href: "/dashboard/boards/filter", label: "Filter Posts", icon: Activity },
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

 const isActive = (href: string) => {
  if (href === "/dashboard") {
   return pathname === "/dashboard";
  }
  if (href === "/dashboard/boards") {
   // Only match /dashboard/boards and its direct sub-paths, BUT exclude the filter page explicitly
   return pathname.startsWith("/dashboard/boards") && !pathname.startsWith("/dashboard/boards/filter");
  }
  return pathname.startsWith(href);
 };

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
       <SidebarIcon className="size-5" />
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
         className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-primary hover:text-black"
        >
         <SidebarIcon  className="size-6" />
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

    <div className={"flex items-center gap-0.5 w-full px-3 justify-center"}>
     <FlagBannerIcon weight="fill" className="size-6.5 text-primary" />
     <h1 className={`text-2xl ${isCollapsedLayout ? "hidden" : "block"}`}>Pittstop</h1>
    </div>

    {/* Plan badge */}
    <div className={cn("px-3 pt-3", isCollapsedLayout && "px-2")}>
     <Link
      href="/subscriptions/plan"
      title={isStartup ? "Startup plan" : "Hobby plan — upgrade"}
      className={cn(
       "flex items-center rounded-md !py-3 transition-colors",
       isCollapsedLayout ? "justify-center px-2 py-2" : "gap-2 px-3 py-2",
       isStartup
        ? "bg-popover"
        : " bg-zinc-800 text-white"
      )}
     >
      {isStartup ? (
       <BadgeCheck weight="fill" className="size-5 shrink-0 text-black" />
      ) : (
       <Rocket weight="fill" className="size-5 shrink-0 text-white" />
      )}
      {!isCollapsedLayout ? (
       <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate !text-black">
         {isStartup ? "Startup plan" : "Hobby plan"}
        </span>
        {!isStartup ? (
         <span className="shrink-0 font-[700] text-[11px] uppercase tracking-wider text-primary">
          upgrade
         </span>
        ) : null}
       </span>
      ) : null}
     </Link>
    </div>

    <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto">
     

     {nav.map((item) => (
      <Link
       key={item.href}
       href={item.href}
       title={isCollapsedLayout ? item.label : undefined}
       className={cn(
        "flex items-center rounded-xl text-md transition-colors",
        isCollapsedLayout ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
        isActive(item.href)
         ? "bg-popover text-foreground"
         : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
       )}
      >
       <item.icon className="size-6 shrink-0" />
       {!isCollapsedLayout ? item.label : null}
      </Link>
     ))}
    </nav>


    {/* Account */}
    <div className={cn("p-3", isCollapsedLayout && "px-2")}>
     <Link
      href="/dashboard/profile"
      title={isCollapsedLayout ? displayName : "Edit your profile"}
      className={cn(
       "flex items-center rounded-xl transition-colors hover:bg-zinc-800",
       isCollapsedLayout ? "justify-center py-2" : "gap-3 px-2 py-2",
       isActive("/dashboard/profile") && "bg-popover text-black"
      )}
     >
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-xs font-medium">
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
        <p className="truncate text-md">{displayName}e</p>
        
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
     <FlagBannerIcon weight="fill" className="size-6 text-primary" />
     <h1 className={`text-2xl font-bold`}>Pittstop</h1>
    </div>
    <button
     onClick={() => setMobileOpen(true)}
     aria-label="Open menu"
     className="flex size-11 items-center justify-center rounded-xl  border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
    >
     <Menu weight="default" className="size-7" />
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
     "sticky hidden shrink-0 flex-col overflow-hidden bg-zinc-950 text-white shadow-sm transition-[width] duration-200 md:flex",
     collapsed ? "w-16" : "w-64"
    )}
   >
    {renderSidebarContent(false)}
   </aside>
  </>
 );
}