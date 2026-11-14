"use client";

import { useState } from "react";
import { Flame, Hash, School, ArrowBigUp, MessageSquare, Send } from "lucide-react";
import { useCommunityStore } from "@/lib/community-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onOpenDmWith: (username: string) => void;
}

export function TrendingTab({ onOpenDmWith }: Props) {
  const { trendingTopics, communities, posts, toggleLikePost, toggleJoinCommunity } =
    useCommunityStore();

  const [selectedTag, setSelectedTag] = useState<string>("All");

  const filteredPosts =
    selectedTag === "All"
      ? posts
      : posts.filter((p) => p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* ── Trending Tags / Flair Bar ── */}
      <div className="space-y-2.5 rounded-xl border border-[#343536] bg-[#1a1a1b] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#d7dadc]">
            <Flame className="h-4 w-4 text-[#ff4500]" />
            <span>Trending Topics & Flairs</span>
          </div>
          <span className="font-mono text-[10px] text-[#818384]">Live Activity</span>
        </div>

        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setSelectedTag("All")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-bold transition-colors",
              selectedTag === "All"
                ? "bg-[#d7dadc] text-black"
                : "bg-[#272729] text-[#818384] hover:text-[#d7dadc]",
            )}
          >
            All
          </button>

          {trendingTopics.map((topic) => (
            <button
              key={topic.tag}
              onClick={() => setSelectedTag(topic.tag === selectedTag ? "All" : topic.tag)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-bold transition-colors",
                selectedTag === topic.tag
                  ? "bg-[#ff4500] text-white"
                  : "bg-[#272729] text-[#818384] hover:text-[#d7dadc]",
              )}
            >
              <Hash className="h-3 w-3 opacity-60" />
              <span>{topic.tag.replace("#", "")}</span>
              <span className="font-sans text-[10px] font-normal opacity-70">
                ({topic.postsCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Popular Sub-Circles Grid ── */}
      <div className="space-y-3 rounded-xl border border-[#343536] bg-[#1a1a1b] p-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#d7dadc]">
          <School className="h-4 w-4 text-indigo-400" />
          <span>Top Campus Circles & Study Hubs</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {communities.map((comm, idx) => (
            <div
              key={comm.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#343536] bg-[#272729] p-3 transition-colors hover:border-[#474748]"
            >
              <div className="min-w-0 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#ff4500]">#{idx + 1}</span>
                  <p className="truncate font-bold text-[#d7dadc]">
                    c/{comm.id.replace("comm-", "")}
                  </p>
                </div>
                <p className="truncate text-[11px] text-[#818384]">{comm.college}</p>
                <p className="font-mono text-[10px] text-[#818384]">{comm.membersCount} members</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toggleJoinCommunity(comm.id);
                  toast.info(comm.isJoined ? `Left c/${comm.id}` : `Joined c/${comm.id}`);
                }}
                className={cn(
                  "h-7 shrink-0 rounded-full px-3 text-xs font-bold transition-colors",
                  comm.isJoined
                    ? "border-[#343536] text-[#818384] hover:text-rose-400"
                    : "border-transparent bg-[#d7dadc] text-black hover:bg-white",
                )}
              >
                {comm.isJoined ? "Joined" : "Join"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ranked Discussions List ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#818384]">
            Ranked Discussions ({filteredPosts.length})
          </h3>
          <span className="font-mono text-[11px] text-[#818384]">Ranked by Upvotes</span>
        </div>

        <div className="space-y-2">
          {filteredPosts.map((post, idx) => (
            <div
              key={post.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#343536] bg-[#1a1a1b] p-3 transition-colors hover:border-[#474748]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-center font-mono text-sm font-black text-[#818384]">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#818384]">
                    <span className="font-bold text-[#d7dadc]">
                      c/{post.communityId.replace("comm-", "")}
                    </span>
                    <span>•</span>
                    <span>u/{post.authorUsername.replace("@", "")}</span>
                    <span>•</span>
                    <span>{post.authorCollege}</span>
                  </div>

                  <h4 className="cursor-pointer truncate text-xs font-bold text-[#d7dadc] hover:text-[#ff4500] sm:text-sm">
                    {post.title}
                  </h4>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-bold text-[#d7dadc]">
                  <ArrowBigUp
                    onClick={() => toggleLikePost(post.id)}
                    className={cn(
                      "h-5 w-5 cursor-pointer",
                      post.likedByUser
                        ? "fill-[#ff4500] text-[#ff4500]"
                        : "text-[#818384] hover:text-[#ff4500]",
                    )}
                  />
                  <span>{post.likes}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#818384]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{post.comments.length}</span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onOpenDmWith(post.authorUsername);
                    toast.info(`Chatting with ${post.authorAlias}`);
                  }}
                  className="h-7 px-2 text-xs font-bold text-primary hover:bg-[#272729]"
                >
                  <Send className="mr-1 h-3 w-3" />
                  <span>DM</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
