"use client";

import { useEffect, useState } from "react";
import { getRoadmapPosts } from "@/lib/roadmap";
import { RoadmapBoard } from "@/components/roadmap-board"; // Fixed broken import
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

interface RoadmapTabContentProps {
 workspaceId: string;
 workspaceSlug: string; // Added workspaceSlug here
}

export function RoadmapTabContent({ workspaceId, workspaceSlug }: RoadmapTabContentProps) {
 const [posts, setPosts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  async function loadRoadmap() {
   const roadmapPosts = await getRoadmapPosts(workspaceId);
   setPosts(roadmapPosts);
   setLoading(false);
  }

  loadRoadmap();
 }, [workspaceId]);

  if (loading) {
  return <Spinner className="size-8 w-full justify-center items-center self-center mt-30"/>
 }

 if (posts.length === 0) {
  return (
   <div className="text-center py-12">
    <p className="text-muted-foreground text-xl">No roadmap items yet</p>
   </div>
  );
 }

 // Fixed rendering syntax and forwarded workspaceSlug down to the board
 return <RoadmapBoard posts={posts} workspaceSlug={workspaceSlug} />;
}