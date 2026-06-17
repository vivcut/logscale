import type { Metadata } from "next";
import { Cal_Sans, Geist, Geist_Mono, Google_Sans, Noto_Sans, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Google_Sans({
 variable: "--font-geist-sans",
 weight: ["400", "600"],
 subsets: ["latin"],
});

import { Analytics } from "@vercel/analytics/next"

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

export const metadata: Metadata = {
 title: "Pitstop — Let your users know what's going on",
 description:
  "The high-performance platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, and more.",
 
 // 1. The base URL for all your relative metadata paths
 metadataBase: new URL("https://Pitstop.com"), // <-- Change to your actual domain
 
 // 2. Standard SEO Keywords
 keywords: ["feedback board", "kanban roadmap", "public changelog", "product management tool", "startup tools"],
 
 // 3. Open Graph (How it looks on Facebook, LinkedIn, Discord)
 openGraph: {
  title: "Pitstop — Let your users know what's going on",
  description: "The high-performance platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, and more.",
  url: "https://Pitstop.com", // <-- Change to your actual domain
  siteName: "Pitstop",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/og-image.png", // Path to your OG image file (usually 1200x630px) in public folder
    width: 1200,
    height: 630,
    alt: "Pitstop Platform Preview",
   },
  ],
 },

 // 4. Twitter Cards (How it looks on X/Twitter)
 twitter: {
  card: "summary_large_image",
  title: "Pitstop — Let your users know what's going on",
  description: "The high-performance platform for startups and indie developers.",
  creator: "@your_twitter_handle", // <-- Change to your Twitter handle
  images: ["/og-image.png"], // Reuse the same image
 },

 // 5. Robots / Search Engine crawling rules
 robots: {
  index: true,
  follow: true,
  nocache: true,
  googleBot: {
   index: true,
   follow: true,
   "max-video-preview": -1,
   "max-image-preview": "large",
   "max-snippet": -1,
  },
 },

 // 6. Icons (Favicon, Apple Touch Icon, Web App Manifest)
 icons: {
  icon: "/favicon.ico",
  shortcut: "/favicon-16x16.png",
  apple: "/apple-touch-icon.png",
 },
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
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
<link rel="manifest" href="/site.webmanifest"/>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    <Analytics />
   </head>
   <body className="min-h-full flex flex-col bg-background text-foreground">
    {children}
   </body>
  </html>
 );
}

