import fs from "fs";
import path from "path";

export interface BlogPost {
 title: string;
 description: string;
 author: string;
 date: string;
 slug: string;
 tags: string[];
 content: string;
}

const BLOG_DIR = path.join(process.cwd(), "blog-notes");

/**
 * Parse frontmatter and content from a blog markdown file.
 */
function parseBlogFile(fileContent: string): BlogPost | null {
 const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
 const match = fileContent.match(frontmatterRegex);

 if (!match) return null;

 const frontmatter = match[1];
 const content = match[2].trim();

 const meta: Record<string, string> = {};
 for (const line of frontmatter.split("\n")) {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) continue;
  const key = line.slice(0, colonIndex).trim();
  const value = line.slice(colonIndex + 1).trim();
  meta[key] = value;
 }

 if (!meta.title || !meta.slug) return null;

 return {
  title: meta.title,
  description: meta.description || "",
  author: meta.author || "Pittstop Team",
  date: meta.date || "",
  slug: meta.slug,
  tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()) : [],
  content,
 };
}

/**
 * Get all blog posts from the blog-notes directory.
 */
export function getAllBlogPosts(): BlogPost[] {
 if (!fs.existsSync(BLOG_DIR)) return [];

 const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".txt"));
 const posts: BlogPost[] = [];

 for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const post = parseBlogFile(fileContent);
  if (post) posts.push(post);
 }

 // Sort by date descending
 posts.sort((a, b) => {
  if (!a.date || !b.date) return 0;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
 });

 return posts;
}

/**
 * Get a single blog post by slug.
 */
export function getBlogPostBySlug(slug: string): BlogPost | null {
 const posts = getAllBlogPosts();
 return posts.find((p) => p.slug === slug) || null;
}

/**
 * Get all blog slugs (for sitemap generation).
 */
export function getAllBlogSlugs(): string[] {
 return getAllBlogPosts().map((p) => p.slug);
}
