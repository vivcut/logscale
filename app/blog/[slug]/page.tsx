import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

interface BlogPageProps {
 params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
 const posts = getAllBlogPosts();
 return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
 const { slug } = await params;
 const post = getBlogPostBySlug(slug);
 if (!post) return {};

 return {
  title: `${post.title} — Pittstop Blog`,
  description: post.description,
  authors: [{ name: post.author }],
  openGraph: {
   title: post.title,
   description: post.description,
   type: "article",
   publishedTime: post.date,
   authors: [post.author],
   url: `https://pittstop.space/blog/${post.slug}`,
  },
  twitter: {
   card: "summary_large_image",
   title: post.title,
   description: post.description,
  },
  alternates: {
   canonical: `https://pittstop.space/blog/${post.slug}`,
  },
 };
}

/**
 * Simple markdown to HTML converter for blog content.
 * Handles headings, bold, italic, links, lists, blockquotes, and paragraphs.
 */
function markdownToHtml(markdown: string): string {
 let html = markdown
  // Code blocks (```...```)
  .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
  // Headings
  .replace(/^### (.+)$/gm, '<h3 class="mt-8 mb-3 text-xl font-semibold tracking-tight">$1</h3>')
  .replace(/^## (.+)$/gm, '<h2 class="mt-10 mb-4 text-2xl font-bold tracking-tight">$1</h2>')
  .replace(/^# (.+)$/gm, '<h1 class="mt-10 mb-4 text-3xl font-bold tracking-tight">$1</h1>')
  // Bold and italic
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\*(.+?)\*/g, "<em>$1</em>")
  // Links
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener">$1</a>')
  // Horizontal rules
  .replace(/^---$/gm, '<hr class="my-8 border-border" />')
  // Unordered lists
  .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
  // Ordered lists
  .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted-foreground">$1</li>')
  // Blockquotes
  .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">$1</blockquote>');

 // Wrap consecutive <li> elements in <ul>
 html = html.replace(/((?:<li[^>]*>.*<\/li>\s*)+)/g, '<ul class="my-4 flex flex-col gap-2">$1</ul>');

 // Wrap remaining lines as paragraphs
 const lines = html.split("\n");
 const result: string[] = [];
 for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) {
   result.push("");
   continue;
  }
  if (
   trimmed.startsWith("<h") ||
   trimmed.startsWith("<ul") ||
   trimmed.startsWith("<ol") ||
   trimmed.startsWith("<li") ||
   trimmed.startsWith("<blockquote") ||
   trimmed.startsWith("<pre") ||
   trimmed.startsWith("<hr")
  ) {
   result.push(trimmed);
  } else {
   result.push(`<p class="my-3 text-muted-foreground leading-relaxed">${trimmed}</p>`);
  }
 }

 return result.join("\n");
}

export default async function BlogPostPage({ params }: BlogPageProps) {
 const { slug } = await params;
 const post = getBlogPostBySlug(slug);

 if (!post) {
  notFound();
 }

 const htmlContent = markdownToHtml(post.content);

 return (
  <>
   <Navbar />
   <main className="flex flex-1 flex-col pt-32 pb-20">
    <article className="mx-auto w-full max-w-3xl px-6">
     {/* Article header */}
     <header className="mb-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
       <time dateTime={post.date}>
        {new Date(post.date).toLocaleDateString("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
        })}
       </time>
       <span>·</span>
       <span>{post.author}</span>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
       {post.title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
       {post.tags.map((tag) => (
        <span
         key={tag}
         className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
        >
         {tag}
        </span>
       ))}
      </div>
     </header>

     {/* Article body */}
     <div
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
     />

     {/* CTA: Back to site */}
     <div className="mt-16 rounded-xl border-2 border-border bg-card p-8 text-center">
      <h3 className="text-xl font-semibold tracking-tight">
       Ready to collect feedback and ship faster?
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
       Pittstop gives you feedback boards, public roadmaps, and changelogs in
       one workspace. Free to start.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
       <Link
        href="/"
        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
       >
        Get started free →
       </Link>
       <Link
        href="/blogs"
        className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
       >
        ← Back to all posts
       </Link>
      </div>
     </div>
    </article>
   </main>
   <Footer />
  </>
 );
}
