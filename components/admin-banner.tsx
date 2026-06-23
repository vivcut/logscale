"use client";

import { BadgeCheck } from "@/components/icons";

export function AdminBanner() {
 return (
  <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
   <BadgeCheck className="size-4" />
   Posting and commenting as a verified admin
  </div>
 );
}
