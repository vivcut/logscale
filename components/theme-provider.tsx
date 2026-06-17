"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme"); // Extracts ?theme=

  React.useEffect(() => {
    const root = window.document.documentElement;

    // 1. Define the system preference listener fallback
    const systemMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const applySystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    // 2. Evaluate current active theme configuration state
    if (themeParam === "dark") {
      root.classList.add("dark");
    } else if (themeParam === "light") {
      root.classList.remove("dark");
    } else {
      // "auto" or missing parameter: Fallback to active system preferences
      applySystemTheme(systemMediaQuery);
      systemMediaQuery.addEventListener("change", applySystemTheme);
    }

    // Clean up event listener on unmount
    return () => {
      systemMediaQuery.removeEventListener("change", applySystemTheme);
    };
  }, [themeParam]);

  return <>{children}</>;
}