import type { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/lib/blog";

const BASE_URL = "https://pittstop.space";

export default function sitemap(): MetadataRoute.Sitemap {
 const blogSlugs = getAllBlogSlugs();

 const staticRoutes: MetadataRoute.Sitemap = [
  {
   url: BASE_URL,
   lastModified: new Date(),
   changeFrequency: "weekly",
   priority: 1,
  },
  {
   url: `${BASE_URL}/blogs`,
   lastModified: new Date(),
   changeFrequency: "weekly",
   priority: 0.8,
  },
  {
   url: `${BASE_URL}/login`,
   lastModified: new Date(),
   changeFrequency: "monthly",
   priority: 0.5,
  },
  {
   url: `${BASE_URL}/privacy`,
   lastModified: new Date(),
   changeFrequency: "yearly",
   priority: 0.3,
  },
  {
   url: `${BASE_URL}/terms`,
   lastModified: new Date(),
   changeFrequency: "yearly",
   priority: 0.3,
  },
 ];

 const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
  url: `${BASE_URL}/blog/${slug}`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.7,
 }));

 return [...staticRoutes, ...blogRoutes];
}
