import Link from "next/link";

import { Rocket, ArrowRight, Check, X } from "@/components/icons";
import { getActiveWorkspace } from "@/lib/workspace";
import { getWorkspaceSubscription, hasStartupPlan } from "@/lib/subscription";

export type PlanPage =
  | "overview"
  | "boards"
  | "roadmap"
  | "changelog"
  | "surveys"
  | "status"
  | "contact"
  | "settings";

/**
 * Per-page copy describing what the Hobby (free) plan limits, and what the
 * Startup plan unlocks. The watermark line applies to every public surface so
 * it appears on each page's "limited" list.
 */
const COPY: Record<PlanPage, { limited: string[]; unlocked: string[] }> = {
  overview: {
    limited: [
      "Only 1 board",
      "No custom board flairs",
      "No image uploads on posts or changelog",
      "Max 1 survey (3 questions), max 2 status links",
      "No extra team members",
      "“Built with ToTheMoon” watermark on public pages",
    ],
    unlocked: [
      "Unlimited boards, surveys & questions",
      "Create custom board flairs",
      "Image uploads everywhere",
      "Unlimited team members",
      "No watermark",
    ],
  },
  boards: {
    limited: [
      "You can only create 1 board",
      "No custom board flairs",
      "Visitors can’t upload images on posts",
      "“Built with ToTheMoon” watermark on public pages",
    ],
    unlocked: [
      "Unlimited boards",
      "Create custom board flairs",
      "Image uploads on posts",
      "No watermark",
    ],
  },
  roadmap: {
    limited: ["“Built with ToTheMoon” watermark on your public roadmap"],
    unlocked: ["No watermark on your public roadmap"],
  },
  changelog: {
    limited: [
      "No image uploads in changelog entries",
      "“Built with ToTheMoon” watermark on your public changelog",
    ],
    unlocked: ["Image uploads in changelog entries", "No watermark"],
  },
  surveys: {
    limited: [
      "Only 1 survey",
      "Max 3 questions per survey",
      "“Built with ToTheMoon” watermark on public forms",
    ],
    unlocked: ["Unlimited surveys", "Unlimited questions", "No watermark"],
  },
  status: {
    limited: [
      "Only 2 monitored links",
      "Base URLs only (no specific paths or directories)",
      "“Built with ToTheMoon” watermark on your public status page",
    ],
    unlocked: [
      "Unlimited monitored links",
      "Monitor any path or directory",
      "No watermark",
    ],
  },
  contact: {
    limited: [
      "Can’t change the title text or message placeholder",
      "“Built with ToTheMoon” watermark on your public contact page",
    ],
    unlocked: ["Fully customizable title & placeholder", "No watermark"],
  },
  settings: {
    limited: [
      "Can’t add extra team members / editors",
      "“Built with ToTheMoon” watermark on public pages & widget",
    ],
    unlocked: ["Unlimited team members", "No watermark"],
  },
};

/**
 * Upgrade banner shown at the top of each dashboard page. Renders nothing when
 * the active workspace is already on the Startup plan. On the Hobby plan it
 * lists what's restricted on THIS page and what the Startup plan unlocks, with
 * a button to upgrade.
 */
export async function PlanBanner({ page }: { page: PlanPage }) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return null;

  const subscription = await getWorkspaceSubscription(workspace.id);
  if (hasStartupPlan(subscription)) return null;

  const { limited, unlocked } = COPY[page];

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Rocket className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              You’re on the Hobby plan — upgrade to Startup for better perks
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Hobby plan limits
                </p>
                <ul className="space-y-1">
                  {limited.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <X className="mt-0.5 size-3 shrink-0 text-destructive" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                  Startup plan unlocks
                </p>
                <ul className="space-y-1">
                  {unlocked.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-xs text-foreground"
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/subscriptions/plan"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Upgrade plan
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
