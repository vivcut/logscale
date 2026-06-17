"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
 ChangelogTimeline,
 type ChangelogEntry,
} from "@/components/changelog-timeline";
import { Spinner } from "@/components/ui/spinner";

interface ChangelogTabContentProps {
 workspaceId: string;
}

export function ChangelogTabContent({ workspaceId }: ChangelogTabContentProps) {
 const [entries, setEntries] = useState<ChangelogEntry[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function loadChangelog() {
   const supabase = createClient();
   const { data } = await supabase
    .from("changelogs")
    .select("id, title, content, published_at")
    .eq("workspace_id", workspaceId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

   setEntries(data || []);
   setLoading(false);
  }

  loadChangelog();
 }, [workspaceId]);

 if (loading) {
  return <Spinner className="size-8 w-full justify-center items-center self-center mt-30"/>
 }

 if (entries.length === 0) {
  return (
   <div className="text-center py-12">
    <p className="text-muted-foreground text-xl">No changelog entries yet</p>
   </div>
  );
 }

 return <ChangelogTimeline entries={entries} />;
}
