"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface BoardsTabContentProps {
 workspaceId: string;
 workspaceSlug: string;
 teamName: string | null;
 teamEmail: string | null;
}

interface Board {
 id: string;
 name: string;
 slug: string;
 description: string | null;
 is_private: boolean;
}

export function BoardsTabContent({
 workspaceId,
 workspaceSlug,
}: BoardsTabContentProps) {
 const [boards, setBoards] = useState<Board[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function loadBoards() {
   const supabase = createClient();
   const { data } = await supabase
    .from("boards")
    .select("id, name, slug, description, is_private")
    .eq("workspace_id", workspaceId)
    .eq("is_private", false);

   setBoards(data || []);
   setLoading(false);
  }

  loadBoards();
 }, [workspaceId]);

 if (loading) {
  return <Spinner className="size-8 w-full justify-center items-center self-center mt-30"/>
 }

 if (boards.length === 0) {
  return (
   <div className="text-center py-12">
    <p className="text-muted-foreground text-xl">No public boards available</p>
   </div>
  );
 }

 return (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
   {boards.map((board) => (
    <Link
     key={board.id}
     href={`/public/${workspaceSlug}/${board.slug}`}
    >
     <Card className="h-full hover:bg-popover cursor-pointer transition-all">
      <CardHeader>
       <CardTitle className="text-base">{board.name}</CardTitle>
       {board.description && (
        <CardDescription className="line-clamp-2">
         {board.description}
        </CardDescription>
       )}
      </CardHeader>
     </Card>
    </Link>
   ))}
  </div>
 );
}
