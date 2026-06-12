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
  Monitor,
  Moon,
  Settings,
  SidebarIcon,
  Sparkles,
  Sun,
} from "@/components/icons";

import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";
import { WorkspaceSwitcher } from "./workspace-switcher";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/boards", label: "Boards", icon: MessageSquare },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: GitBranch },
  { href: "/dashboard/changelog", label: "Changelog", icon: Sparkles },
  { href: "/dashboard/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/dashboard/status", label: "Status", icon: Activity },
  { href: "/dashboard/contact-page", label: "Contact", icon: Mail },
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
  displayName,
  displayEmail,
  avatarUrl,
}: {
  workspaces: Workspace[];
  displayName: string;
  displayEmail: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  // Restore the persisted collapse preference (expanded by default).
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

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-card/40 transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "gap-1 px-4"
        )}
      >
        {collapsed ? (
          <button
            onClick={toggleCollapsed}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <SidebarIcon className="size-4" />
          </button>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <WorkspaceSwitcher workspaces={workspaces} />
            </div>
            <button
              onClick={toggleCollapsed}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <SidebarIcon className="size-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {!collapsed ? (
          <span className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            workspace
          </span>
        ) : null}
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center rounded-md text-sm transition-colors",
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
              isActive(item.href)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed ? item.label : null}
          </Link>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className={cn("px-3 pb-1", collapsed && "px-2")}>
        <ThemeToggle collapsed={collapsed} />
      </div>

      {/* Account */}
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center rounded-md",
            collapsed ? "justify-center py-2" : "gap-3 px-2 py-2"
          )}
          title={collapsed ? displayName : undefined}
        >
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-medium">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="size-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          ) : null}
        </div>
        {!collapsed ? <SignOutButton /> : null}
      </div>
    </aside>
  );
}

type Theme = "system" | "light" | "dark";

const THEMES: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

/**
 * Applies the chosen theme to <html> and persists it. "system" follows the OS
 * via prefers-color-scheme — mirrors the no-flash boot script in app/layout.tsx.
 */
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

    // Keep "system" in sync with live OS changes.
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

  if (collapsed) {
    // Cycle System → Light → Dark on click when collapsed.
    const order: Theme[] = ["system", "light", "dark"];
    const current = THEMES.find((t) => t.value === theme) ?? THEMES[0];
    const Icon = current.icon;
    return (
      <button
        onClick={() => pick(order[(order.indexOf(theme) + 1) % order.length])}
        title={`Theme: ${current.label}`}
        aria-label={`Theme: ${current.label} (click to change)`}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-secondary/40 p-0.5">
      {THEMES.map((t) => {
        const Icon = t.icon;
        const active = theme === t.value;
        return (
          <button
            key={t.value}
            onClick={() => pick(t.value)}
            title={t.label}
            aria-label={t.label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[5px] py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
