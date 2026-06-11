import {
  ArrowRight,
  ArrowUp,
  GitBranch,
  MessageSquare,
  Sparkles,
} from "@/components/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: MessageSquare,
    tag: "boards",
    title: "Feedback Boards",
    description:
      "Collect, organize, and prioritize feature requests with anonymous fingerprinted voting.",
  },
  {
    icon: GitBranch,
    tag: "roadmap",
    title: "Kanban Roadmaps",
    description:
      "Turn the loudest signals into a public roadmap your users can follow in real time.",
  },
  {
    icon: Sparkles,
    tag: "changelog",
    title: "Public Changelogs",
    description:
      "Ship updates in markdown and announce them with a clean, scannable changelog.",
  },
];

const roadmap = [
  { status: "planned", title: "Slack notifications", votes: 128 },
  { status: "in-progress", title: "Custom domains", votes: 342 },
  { status: "completed", title: "Anonymous voting", votes: 511 },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <span className="font-mono text-xs font-bold">↑</span>
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight">
              tothemoon
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#">
              Boards
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Roadmap
            </a>
            <a className="transition-colors hover:text-foreground" href="#">
              Changelog
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm">
              Get started
              <ArrowRight />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-28 text-center">
        <Badge
          variant="outline"
          className="mb-6 gap-1.5 border-border font-mono text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-chart-1" />
          v1.0 — now in public beta
        </Badge>
        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight md:text-6xl">
          The feedback platform built for{" "}
          <span className="text-muted-foreground">shipping fast.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Feedback boards, kanban roadmaps, and public changelogs in one sleek,
          high-performance workspace. Built for startups and indie developers.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg">
            Start for free
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline">
            View live demo
          </Button>
        </div>
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          // no credit card required · free forever tier
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="rounded-none border-0 bg-card shadow-none"
            >
              <CardHeader>
                <div className="mb-2 flex size-9 items-center justify-center rounded-md border border-border bg-secondary text-foreground">
                  <feature.icon className="size-4" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  /{feature.tag}
                </span>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap preview */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-32">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            What&apos;s shipping next
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            sorted by upvotes
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          {roadmap.map((item, i) => (
            <div
              key={item.title}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-mono">
                  {item.status}
                </Badge>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono tabular-nums"
              >
                <ArrowUp className="size-3.5" />
                {item.votes}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <span className="font-mono text-xs">© 2026 tothemoon</span>
          <span className="font-mono text-xs">
            built with next.js · supabase · shadcn/ui
          </span>
        </div>
      </footer>
    </main>
  );
}
