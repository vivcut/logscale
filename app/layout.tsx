import type { Metadata } from "next";
import { Cal_Sans, Geist, Geist_Mono, Google_Sans, Noto_Sans, Poppins, Nunito_Sans, Manrope, DM_Sans, Ubuntu, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Outfit ({
 variable: "--font-geist-sans",
 weight: ["400", "500","600" , "700", "800"],
 subsets: ["latin"],
});

import { Analytics } from "@vercel/analytics/next"

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

export const metadata: Metadata = {
 title: "Pittstop — Let your users know what's going on",
 description:
  "The high-performance platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, and more.",
 
 // 1. The base URL for all your relative metadata paths
 metadataBase: new URL("https://pittstop.space"), // <-- Change to your actual domain
 
 // 2. Standard SEO Keywords
 keywords: ["feedback board", "kanban roadmap", "public changelog", "product management tool", "startup tools"],
 
 // 3. Open Graph (How it looks on Facebook, LinkedIn, Discord)
 openGraph: {
  title: "Pittstop — Let your users know what's going on",
  description: "The high-performance platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, and more.",
  url: "https://pittstop.space", // <-- Change to your actual domain
  siteName: "Pittstop",
  locale: "en_US",
  type: "website",
  images: [
   {
    url: "/og-image.png", // Path to your OG image file (usually 1200x630px) in public folder
    width: 1200,
    height: 630,
    alt: "Pittstop Platform Preview",
   },
  ],
 },

 // 4. Twitter Cards (How it looks on X/Twitter)
 twitter: {
  card: "summary_large_image",
  title: "Pittstop — Let your users know what's going on",
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


const jsonLd = {
 "@context": "https://schema.org",
 "@graph": [
  {
   "@type": "Organization",
   "@id": "https://pittstop.space/#organization",
   name: "Pittstop",
   url: "https://pittstop.space",
   logo: "https://pittstop.space/android-chrome-512x512.png",
   description:
    "The all-in-one feedback platform for startups and indie developers. Feedback boards, kanban roadmaps, public changelogs, surveys, and status pages.",
   sameAs: [],
  },
  {
   "@type": "WebSite",
   "@id": "https://pittstop.space/#website",
   url: "https://pittstop.space",
   name: "Pittstop",
   publisher: { "@id": "https://pittstop.space/#organization" },
   description:
    "Collect user feedback, prioritize with kanban roadmaps, and announce updates with public changelogs.",
  },
  {
   "@type": "SoftwareApplication",
   name: "Pittstop",
   applicationCategory: "BusinessApplication",
   operatingSystem: "Web",
   offers: [
    {
     "@type": "Offer",
     price: "0",
     priceCurrency: "USD",
     name: "Hobby",
     description: "Free forever plan with 1 feedback board, roadmap, changelog, 25 users.",
    },
    {
     "@type": "Offer",
     price: "14",
     priceCurrency: "USD",
     name: "Startup",
     description: "Unlimited boards, status sites, team members, infinite users and no watermark.",
    },
   ],
   aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
   },
  },
 ],
};

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
     <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
     />
     <Analytics />
    </head>
   <body className="min-h-full flex flex-col bg-background text-foreground">
    {children}
   </body>
  </html>
 );
}

