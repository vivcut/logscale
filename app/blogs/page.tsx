import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
 title: "Blog — Pittstop | Tips on Feedback, Roadmaps & Product Management",
 description:
  "Read the latest articles on collecting user feedback, building public roadmaps, writing changelogs, and shipping products your users love. Expert tips for startups and indie developers.",
 openGraph: {
  title: "Blog — Pittstop",
  description:
   "Expert articles on feedback collection, public roadmaps, changelogs, and product management for startups.",
  type: "website",
  url: "https://pittstop.com/blogs",
 },
 alternates: {
  canonical: "https://pittstop.com/blogs",
 },
};

export default function BlogsPage() {
 const posts = getAllBlogPosts();

 return (
  <>
   <Navbar />
   <main className="flex flex-1 flex-col pt-32 pb-20">
    <div className="mx-auto w-full max-w-4xl px-6">
     <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
       Blog
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
       Tips, strategies, and best practices for collecting user feedback and
       shipping better products.
      </p>
     </div>

     <div className="mt-16 flex flex-col gap-8">
      {posts.map((post) => (
       <Link
        key={post.slug}
        href={`/blog/${post.slug}`}
        className="group block rounded-xl border-2 border-border p-6 transition-all hover:border-primary/30 hover:shadow-lg"
       >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
        <h2 className="mt-3 text-xl font-semibold tracking-tight group-hover:text-primary md:text-2xl">
         {post.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
         {post.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
         {post.tags.slice(0, 4).map((tag) => (
          <span
           key={tag}
           className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
          >
           {tag}
          </span>
         ))}
        </div>
       </Link>
      ))}
     </div>

     {posts.length === 0 && (
      <p className="mt-16 text-center text-muted-foreground">
       No blog posts yet. Check back soon!
      </p>
     )}
    </div>
   </main>
   <Footer />
  </>
 );
}
