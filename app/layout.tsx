import type { Metadata } from "next";
import { Geist, Geist_Mono, Google_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Google_Sans({
  variable: "--font-geist-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

import { Analytics } from "@vercel/analytics/next"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LogScale — Let your users know what's going on",
  description:
    "The high-performance platform for startups and indie developers. Feedback boards, kanban roadmaps,  public changelogs and more.",
};

// Runs before first paint to apply the saved theme (default: follow the OS).
// Stored in localStorage under "theme" = "system" | "light" | "dark". This
// prevents a flash of the wrong theme. Public pages never write this value, so
// visitors always get the OS-resolved scheme there.
const themeScript = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){document.documentElement.classList.add("dark");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.className} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Analytics />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

