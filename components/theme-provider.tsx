"use client";

import * as React from "react";

/**
 * ThemeProvider is a no-op passthrough — the app is light-mode only.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
 return <>{children}</>;
}
