"use client";

import { Moon, Sun, X } from "@phosphor-icons/react";
import { useState, useEffect } from "react";

export function ThemePopup() {
 const [isVisible, setIsVisible] = useState(false);
 const [theme, setTheme] = useState<"light" | "dark">("dark");

 useEffect(() => {
  // 1. Check if the user previously dismissed the popup via cookies
  const isDismissed = document.cookie
   .split("; ")
   .find((row) => row.startsWith("theme-popup-dismissed="));

  if (!isDismissed) {
   // Small delay for a nice entry animation after page load
   const timer = setTimeout(() => setIsVisible(true), 1500);
   return () => clearTimeout(timer);
  }
 }, []);

 useEffect(() => {
  // 2. Synchronize initial theme state with the DOM class
  if (document.documentElement.classList.contains("light")) {
   setTheme("light");
  } else {
   setTheme("dark");
  }
 }, []);

 const toggleTheme = (newTheme: "light" | "dark") => {
  setTheme(newTheme);
  if (newTheme === "light") {
   document.documentElement.classList.add("light");
   document.documentElement.classList.remove("dark");
  } else {
   document.documentElement.classList.add("dark");
   document.documentElement.classList.remove("light");
  }
 };

 const handleDismiss = () => {
  setIsVisible(false);
  // 3. Set a cookie to remember dismissal for 30 days
  const expires = new Date();
  expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
  document.cookie = `theme-popup-dismissed=true; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
 };

 if (!isVisible) return null;

 return (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-full  border border-border border-white/10 bg-black/80 p-2 pl-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 dark:border-white/10 dark:bg-black/80 light:border-black/10 light:bg-white/80">
   <span className="text-xs font-medium text-white/80 light:text-black/80">
    Theme
   </span>

   {/* Toggle Segment */}
   <div className="flex p-0.5 space-x-4 rounded-full bg-white/5 light:bg-black/5">
    <button
     onClick={() => toggleTheme("dark")}
     className={`rounded-full p-1.5 transition-colors ${
      theme === "dark"
       ? "bg-white text-black"
       : "text-white/60 hover:text-white"
     }`}
     aria-label="Dark Mode"
    >
     <Moon className="h-3.5 w-3.5" />
    </button>
    <button
     onClick={() => toggleTheme("light")}
     className={`rounded-full p-1.5 transition-colors ${
      theme === "light"
       ? "bg-black text-white dark:bg-white dark:text-black"
       : "text-white/60 light:text-black/60 hover:text-white light:hover:text-black"
     }`}
     aria-label="Light Mode"
    >
     <Sun  className="h-3.5 w-3.5" />
    </button>
   </div>

   {/* Vertical Divider */}
   <div className="h-4 w-[1px] bg-white/20 light:bg-black/20" />

   {/* Close button */}
   <button
    onClick={handleDismiss}
    className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white light:text-black/40 light:hover:bg-black/10 light:hover:text-black transition-colors mr-1"
    aria-label="Dismiss customizer"
   >
    <X className="h-3.5 w-3.5" />
   </button>
  </div>
 );
}