"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Use a ref to track if we've already applied the theme this session
// This prevents the effect from running on every single re-render.
function ThemeSync() {
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme");
  const hasApplied = React.useRef(false);

  React.useEffect(() => {
    // Only run if we haven't applied a theme yet OR if the URL param actually changed
    // We check the document element class to avoid unnecessary DOM writes
    const root = window.document.documentElement;
    const isDark = root.classList.contains("dark");

    if (theme === "dark" && !isDark) {
      root.classList.add("dark");
      hasApplied.current = true;
    } else if (theme === "light" && isDark) {
      root.classList.remove("dark");
      hasApplied.current = true;
    } else if (theme === "auto" || !theme) {
      // Auto mode: check system preference once
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark && !isDark) {
        root.classList.add("dark");
      } else if (!prefersDark && isDark) {
        root.classList.remove("dark");
      }
      hasApplied.current = true;
    }
  }, [theme]); // Only re-run if the 'theme' param specifically changes

  return null;
}

export default function SecondaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ThemeSync />
      </Suspense>
      {children}
    </>
  );
}